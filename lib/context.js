const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');

const shell = require('./shell');
const Skills = require('./skills');
const Session = require('./session');
const Analytics = require('./analytics');
const Db = require('./db');
const Logger = require('./logger');

module.exports = class Context {
  constructor() {
    let firstRun = false;
    this.homePath = path.join(os.homedir(), '.niles');
    this.modulePath = path.join(__dirname, '..');

    this.shell = shell;
    this.axios = axios;
    this.logger = new Logger(this);

    this.handlers = this.shell.ls(path.join(__dirname, 'handlers'))
      .filter(file => file !== 'handler.js')
      .reduce((o, file) => ({
        ...o,
        [path.basename(file, '.js')]: new (require(path.join(__dirname, 'handlers', file)))(this), // eslint-disable-line
      }), {});

    this.analytics = new Analytics(this);

    if (!fs.existsSync(this.homePath)) {
      fs.mkdirSync(this.homePath);
      this.analytics.track('install');
      firstRun = true;
    }

    this.db = new Db(this);
    this.session = new Session(this);
    this.session.firstRun = firstRun;
  }

  async load() {
    await this.loadSkills();
  }

  async loadSkills() {
    this.skills = new Skills(this);
    await this.skills.loadSkills();
  }
};
