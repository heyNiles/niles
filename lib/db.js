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

  getSetting(name) {
    return this.lowdb.get('settings').value()[name];
  }

  saveSetting(name, value) {
    return this.lowdb.set(`settings.${name}`, value).write();
  }
};
