const Handler = require('./handler');

module.exports = class Git extends Handler {
  constructor(ctx) {
    super(ctx);

    this.permissions = {
      GIT_READ_SETTINGS: {
        name: 'readGitSettings',
        enableCommand: namespace => `allow skill ${namespace} to access my github settings`,
        disableCommand: namespace => `dont allow skill ${namespace} to access my github settings`,
        usageConfirmation: (namespace, usageDescription) => `Allow skill "${namespace}" to access your GitHub settings, in order to ${usageDescription}?`,
        decorator: 'readsGitSettingsTo',
        checker: 'canReadGitSettings',
      },
    };
  }

  async userName() {
    await this.assertPermission(this.permissions.GIT_READ_SETTINGS);

    return this.ctx.shell.exec('git config user.name').stdout.trim();
  }

  async userEmail() {
    await this.assertPermission(this.permissions.GIT_READ_SETTINGS);

    return this.ctx.shell.which('git config user.email').stdout.trim();
  }
};
