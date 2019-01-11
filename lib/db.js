const path = require('path');
const low = require('lowdb');
const shortid = require('shortid');
const FileSync = require('lowdb/adapters/FileSync');
const { isBefore, subDays } = require('date-fns');

module.exports = class Db {
  constructor(ctx) {
    this.ctx = ctx;
    const adapter = new FileSync(path.join(ctx.homePath, 'db.json'));

    this.lowdb = low(adapter);
    this.lowdb.defaults({
      sessions: [],
      profile: {
        id: shortid.generate(),
        createdAt: Date.now(),
      },
      settings: {},
    }).write();

    this.lowdb.get('sessions')
      .filter(h => isBefore(new Date(h.startedAt), subDays(Date.now(), 1)))
      .remove();
  }

  recentSessions() {
    return this.lowdb.get('sessions');
  }

  profile() {
    return this.lowdb.get('profile').value();
  }

  get(name) {
    const settings = this.lowdb.get('settings').value();
    const { intent } = this.ctx.session;
    const { namespace } = intent.skill;

    return settings[`${namespace}_${name}`];
  }

  save(name, value) {
    const { intent } = this.ctx.session;
    const { namespace } = intent.skill;

    return this.lowdb.set(`settings.${namespace}_${name}`, value).write();
  }
};
