module.exports = class Npm {
  constructor(ctx) {
    this.ctx = ctx;

    this.globalModulePath = this.ctx.shell.exec('npm root -g').stdout.trim();
  }

  async getGlobalModules(depth = 1) {
    const stdout = await this.ctx.shell.execAsync(`npm list -g --depth ${depth}`);
    const path = stdout.shift();
    const deps = this.ctx.shell.parseTree(stdout, element => ({
      name: element.value,
      dependencies: element.children,
    })).dependencies;

    return {
      path,
      deps,
    };
  }

  getGlobalModuleList() {
    return this.ctx.shell.ls(this.globalModulePath);
  }
};
