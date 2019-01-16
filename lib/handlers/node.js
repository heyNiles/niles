const Handler = require('./handler');

module.exports = class Node extends Handler {
  getVersion() {
    return this.ctx.shell.exec('node -v').stdout.trim();
  }

  getInstallationPath() {
    return this.ctx.shell.which('node').stdout.trim();
  }
};
