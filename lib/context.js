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

const Npm = require('./handlers/npm');
const Node = require('./handlers/node');

module.exports = class Context {
  constructor() {
    this.homePath = path.join(os.homedir(), '.niles');
    this.modulePath = path.join(__dirname, '..');

    this.shell = shell;
    this.axios = axios;
    this.logger = new Logger(this);
    this.handlers = {
      npm: new Npm(this),
      node: new Node(this),
    };
    this.analytics = new Analytics(this);

    if (!fs.existsSync(this.homePath)) {
      fs.mkdirSync(this.homePath);
      this.analytics.track('install');
    }

    this.db = new Db(this);
    this.session = new Session(this);
  }

  async load() {
    await this.loadSkills();
  }

  async loadSkills() {
    this.skills = new Skills(this);
    await this.skills.loadSkills();
  }
};
