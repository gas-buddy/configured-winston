export default class WrappedLogger {
  constructor(logger, additionalMetadata) {
    this.logger = logger;
    this.meta = additionalMetadata;
  }

  applyAdditionalMetadata(meta) {
    // Because of the ordering, passed in metadata wins
    if (this.meta) {
      if (typeof this.meta === 'function') {
        return this.meta(meta);
      }
      return meta ? Object.assign({}, this.meta, meta) : this.meta;
    }
    return meta;
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

  loggerWithDefaults(meta) {
    return new WrappedLogger(this, meta);
  }
}
