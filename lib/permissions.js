const PERMISSION_SETTING_PREFIX = '__perm_';

module.exports = class Permissions {
  constructor(ctx) {
    this.ctx = ctx;

    this.all = {
      USE_DAEMON: {
        name: 'useDaemon',
        enableCommand: namespace => `allow skill ${namespace} to use daemons`,
        disableCommand: namespace => `dont allow skill ${namespace} to use daemons`,
        usageConfirmation: (namespace, usageDescription) => `Allow skill ${namespace} to spin a small, local daemon to ${usageDescription}?`,
        decorator: 'usesDaemonTo',
        checker: 'canUseDaemon',
      },
    };

    Object.keys(this.ctx.handlers)
      .map(k => this.ctx.handlers[k])
      .forEach(handler => Object.assign(
        this.all,
        handler.permissions,
      ));

    Object.keys(this.all)
      .map(k => this.all[k])
      .forEach(permission => Object.assign(
        this,
        {
          [permission.checker]: () => this.get(permission),
        },
      ));
  }

  async getSaved(name) {
    return this.ctx.db.get(`${PERMISSION_SETTING_PREFIX}${name}`);
  }

  async save(name, value) {
    this.ctx.db.save(`${PERMISSION_SETTING_PREFIX}${name}`, value);
  }

  async get(perm) {
    let savedValue = await this.getSaved(perm.name);

    if (typeof savedValue === 'undefined') {
      const {
        logger: { inquirer },
        session: { intent },
      } = this.ctx;
      const { skill } = intent;
      let usageDescriptor = intent.permissionUsage.find(pu => pu.type === perm.name);

      if (!usageDescriptor) {
        usageDescriptor = skill.permissionUsage.find(pu => pu.type === perm.name);
      }

      if (!usageDescriptor) {
        throw new Error(`Usage description not set on skill or intent for the ${perm.name} permission`);
      }

      const { confirmation } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmation',
        message: perm.usageConfirmation(skill.namespace, usageDescriptor.text),
        default: true,
      }]);

      this.save(perm.name, confirmation);
      savedValue = confirmation;
    }

    return {
      permission: savedValue,
      enableCommand: perm.enableCommand,
      disableCommand: perm.disableCommand,
    };
  }

  decorate(skilldef) {
    Object.keys(this.all)
      .map(k => this.all[k])
      .forEach(permission => Object.assign(
        skilldef,
        {
          [permission.decorator]: (usageExplanation) => {
            skilldef.permissionUsage.push({
              type: permission.name,
              text: usageExplanation,
            });
          },
        },
      ));
  }
};
