const shortid = require('shortid');

module.exports = class Session {
  constructor(ctx) {
    this.ctx = ctx;

    this.command = undefined;
    this.result = undefined;
    this.error = undefined;
    this.dev = false;
    this.queryResults = undefined;
    this.intent = undefined;
    this.action = undefined;
    this.description = undefined;
    this.createdAt = Date.now();
    this.interpretedAt = undefined;
    this.startedAt = undefined;
    this.endedAt = undefined;
  }

  save() {
    return this.ctx.db.lowdb.get('sessions')
      .push(this.toObject())
      .write();
  }

  track() {
    this.ctx.analytics.track('command', this.toObject());
  }

  toObject() {
    let { error } = this;
    let queryResult;

    if (error) {
      error = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }

    if (this.queryResults) {
      [queryResult] = this.queryResults;
      if (queryResult) {
        delete queryResult.intent_ranking;
      }
    }

    return {
      id: shortid.generate(),
      startedAt: this.startedAt,
      createdAt: this.createdAt,
      interpretedAt: this.interpretedAt,
      endedAt: this.endedAt,
      command: this.command,
      error,
      ...(this.dev ? {
        dev: true,
      } : {
        dev: false,
        queryResult,
      }),
    };
  }
};
