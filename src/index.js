import winston from 'winston';
import WrappedLogger from './WrappedLogger';

export default class ConfiguredLogstash {
  constructor(context, opts) {
    this.shutdownFunctions = [];

    // We configure this right away - not waiting for start because
    // other hydrated objects probably want to have winston logging work
    winston.info('Configuring winston');

    const transports = (opts || {}).transports || [];
    for (const [, spec] of Object.entries(transports)) {
      if (spec.enabled !== false) {
        if (!spec.module && !spec.name) {
          throw new Error(`Invalid transport specified, missing module or name: ${spec}`);
        }

        // Some transports need clean shutdown, this method is used for that
        if (spec.stop) {
          this.shutdownFunctions.push(spec.stop);
        } else if (spec.module && spec.module.stop) {
          this.shutdownFunctions.push(spec.module.stop);
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
          winston.add(spec.name ? winston.transports[spec.name] : spec.module, spec.config);
        }
      }
    }

    // As a convenience, you can configure this module to REMOVE the console logger
    if (opts && opts.console === false) {
      winston.remove(winston.transports.Console);
    }

    winston.info('Configured winston logging');
  }

  // eslint-disable-next-line class-methods-use-this
  start() {
    this.rootLogger = new WrappedLogger(winston);
    return this.rootLogger;
  }

  async stop() {
    winston.info('Winston login shutdown beginning');
    const promises = this.shutdownFunctions.map(f => f());
    await Promise.all(promises);
  }
}
