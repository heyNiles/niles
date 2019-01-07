module.exports = class Node {
  constructor(ctx) {
    this.ctx = ctx;
  }

  getVersion() {
    return this.ctx.shell.exec('node -v').stdout.trim();
  }

  getInstallationPath() {
    return this.ctx.shell.which('node').stdout.trim();
  }
};
