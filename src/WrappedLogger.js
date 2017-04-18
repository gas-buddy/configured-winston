export default class WrappedLogger {
  constructor(logger, additionalMetadata, options) {
    this.logger = logger;
    this.meta = additionalMetadata;
    this.dynamic = options ? options.dynamicFields : null;
    this.counter = 1;
    this.spanContext = logger.spanContext;

    const needsDynamic = this.spanContext ||
      (options && (options.addTimestamp || options.addCounter));
    if (needsDynamic) {
      this.dynamic = () => {
        const addl = {};

        if (options.addTimestamp) {
          addl.ts = Date.now();
        }
        if (options.addCounter) {
          const ctr = this.counter;
          this.counter += 1;
          addl.ctr = ctr;
        }
        if (this.spanContext) {
          addl.span = this.spanId;
        }

        return addl;
      };
    }
  }

  applyAdditionalMetadata(meta) {
    // Because of the ordering, passed in metadata wins
    if (this.meta) {
      if (typeof this.meta === 'function') {
        return this.meta(meta);
      }
      const base = this.dynamic ? this.dynamic() : {};
      return Object.assign(base, this.meta, meta);
    }
    return meta;
  }

  pushSpan() {
    if (!this.spanContext) {
      this.spanContext = {};
    }
    const c = this.spanContext;

    if (!c.id) {
      c.id = '1';
      c.ids = [1];
      c.counts = [1];
    } else {
      if (c.counts.length === c.ids.length) {
        c.counts.push(1);
      } else {
        c.counts[c.counts.length - 1] += 1;
      }
      c.ids.push(c.counts[c.counts.length - 1]);
      c.id = c.ids.join('.');
    }
  }

  popSpan() {
    const c = this.spanContext;
    if (!c.id) {
      this.logger.error('popSpan called without an active span', { stack: new Error().stack });
      return;
    }
    if (!c.counts[c.ids.length - 1]) {
      this.logger.error('popSpan called on a span this process did not create', {
        spanId: this.spanId,
        stack: new Error().stack,
      });
      return;
    }
    c.ids = c.ids.slice(0, c.ids.length - 1);
    c.id = c.ids.join('.');
  }

  importSpan(spanId) {
    if (this.spanContext) {
      this.logger.error('Importing a spanId on a logger which already has spans',
        { stack: new Error().stack });
      return;
    }
    this.spanContext = {
      id: spanId,
      ids: spanId.split('.'),
    };
    this.spanContext.counts = new Array(this.spanContext.ids.length);
  }

  get spanId() {
    return this.spanContext ? this.spanContext.id : undefined;
  }

  debug(msg, meta) {
    return this.logger.debug(msg, this.applyAdditionalMetadata(meta));
  }

  info(msg, meta) {
    return this.logger.info(msg, this.applyAdditionalMetadata(meta));
  }

  warn(msg, meta) {
    return this.logger.warn(msg, this.applyAdditionalMetadata(meta));
  }

  error(msg, meta) {
    return this.logger.error(msg, this.applyAdditionalMetadata(meta));
  }

  loggerWithDefaults(meta, options) {
    return new WrappedLogger(this, meta, options);
  }
}
