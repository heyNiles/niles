const Handler = require('./handler');

module.exports = class Git extends Handler {
  constructor(ctx) {
    super(ctx);

    this.permissions = {
      GIT_READ_CONFIGS: {
        name: 'readGitConfigs',
        enableCommand: namespace => `allow skill ${namespace} to access my github configs`,
        disableCommand: namespace => `dont allow skill ${namespace} to access my github configs`,
        usageConfirmation: (namespace, usageDescription) => `Allow skill "${namespace}" to access your GitHub configs, in order to ${usageDescription}?`,
        decorator: 'readsGitConfigsTo',
        checker: 'canReadGitConfigs',
      },
    };
  }

  async readConfig(name) {
    await this.assertPermission(this.permissions.GIT_READ_CONFIGS);

    return this.ctx.shell.exec(`git config ${name}`).stdout.trim();
  }
};
