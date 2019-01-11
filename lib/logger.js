const inquirer = require('inquirer');
const chalk = require('chalk');
const { image2braille } = require('braille-art');

const table = require('./table');

module.exports = class Logger {
  constructor(ctx) {
    this.ctx = ctx;
    this.inquirer = inquirer;
    this.chalk = chalk;
    this.table = table;
    this.image2braille = image2braille;
    this.logger = console;
    this.logs = [];
    this.levels = {
      TRACE: 'TRACE',
      DEBUG: 'DEBUG',
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR',
    };
  }

  output(level, ...args) {
    this.logger[level.toLowerCase()](...args);
    this.logs.push({ level, message: [...args] });
  }

  trace(...args) {
    this.output(this.levels.TRACE, ...args);
  }

  debug(...args) {
    this.output(this.levels.DEBUG, ...args);
  }

  log(...args) {
    this.debug(...args);
  }

  info(...args) {
    this.output(this.levels.INFO, ...args);
  }

  warn(...args) {
    this.output(this.levels.WARN, ...args);
  }

  error(...args) {
    this.output(this.levels.ERROR, ...args);
  }
};
