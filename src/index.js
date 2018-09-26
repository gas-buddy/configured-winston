import winston from 'winston';
import WrappedLogger from './WrappedLogger';

export default class ConfiguredLogstash {
  constructor(context, options) {
    const opts = options || {};
    this.shutdownFunctions = [];
    this.meta = opts.meta;
    this.addTimestamp = opts.addTimestamp;
    this.addCounter = opts.addCounter;
    this.listenForUnhandledRejection = opts.listenForUnhandleRejection;
    this.listenForUncaughtException = opts.listenForUncaughtException;

    // We configure this right away - not waiting for start because
    // other hydrated objects probably want to have winston logging work
    winston.info('Configuring winston');

    const transports = opts.transports;
    if (transports) {
      for (const [, spec] of Object.entries(transports)) {
        if (spec.enabled !== false) {
          if (!spec.module && !spec.name) {
            throw new Error(`Invalid transport specified, missing module or name: ${spec}`);
          }

          if (spec.name && !winston.transports[spec.name]) {
            throw new Error(`Transport ${spec.name} specified a name, but that is not a property on winston.transports`);
          }

          let shouldAdd = true;
          if (typeof spec.start === 'function') {
            // If the start function returns true, that means they've already added the transport
            shouldAdd = spec.start(spec.config) !== true;
          } else if (spec.module && spec.module.start) {
            // If the start function returns true, that means they've already added the transport
            shouldAdd = spec.module.start(spec.config) !== true;
          }
          if (shouldAdd) {
            try {
              winston.add(spec.name ? winston.transports[spec.name] : spec.module, spec.config);
            } catch (error) {
              if (process.env.NODE_ENV !== 'test' ||
                !error.message.match(/Transport already attached/)) {
                throw error;
              }
            }
          }

          // Some transports need clean shutdown, this method is used for that
          if (spec.stop) {
            this.shutdownFunctions.push(spec.stop);
          } else if (spec.module && spec.module.stop) {
            this.shutdownFunctions.push(spec.module.stop);
          }
          if (shouldAdd) {
            this.shutdownFunctions.push(() => {
              winston.remove(spec.name ? winston.transports[spec.name] : spec.module);
            });
          }
        }
      }
    }

    // As a convenience, you can configure this module to REMOVE the console logger
    if (opts && opts.console === false) {
      try {
        winston.remove(winston.transports.Console);
      } catch (error) {
        if (!error.message.match(/Transport console not attached/)) {
          throw error;
        }
      }
    }
    if (opts && opts.level) {
      winston.level = opts.level;
    }

    winston.info('Configured winston logging');
  }

  // eslint-disable-next-line class-methods-use-this
  start() {
    this.rootLogger = new WrappedLogger(winston, this.meta, {
      addTimestamp: this.addTimestamp,
      addCounter: this.addCounter,
    });
    
    if (this.listenForUnhandleRejection) {
      process.on('unhandledRejection', err => 
        this.rootLogger.error('unhandled rejection', err)
      );
    }

    if (this.listenForUncaughtException) {
      process.on('uncaughtException', err =>
        this.rootLogger.error('uncaught exception', err)
      );
    }

    return this.rootLogger;
  }

  async stop() {
    // Wait for transports to flush
    await new Promise(accept => winston.info('Winston login shutdown beginning', accept));
    const promises = this.shutdownFunctions.map(f => f());
    await Promise.all(promises);
  }
}
