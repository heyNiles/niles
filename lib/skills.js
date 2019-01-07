const path = require('path');
const fs = require('fs');

const Skill = require('./skill');
const Intent = require('./intent');
const help = require('./help');

module.exports = class Skills {
  constructor(ctx) {
    this.ctx = ctx;
    this.installed = [];
  }

  getPathsToInstalledSkills() {
    const { npm } = this.ctx.handlers;
    return npm
      .getGlobalModuleList()
      .filter(name => name.startsWith('niles-'))
      .map(name => path.join(npm.globalModulePath, name));
  }

  getPathsToStandardSkills() {
    const { shell } = this.ctx;
    return shell
      .ls(path.join(__dirname, '..', 'node_modules'))
      .filter(name => name.startsWith('niles-'))
      .map(name => path.join(__dirname, '..', 'node_modules', name));
  }

  getPathsToDevSkills() {
    const { shell } = this.ctx;
    return shell
      .ls(path.join(__dirname, '..', 'skills'))
      .map(name => path.join(__dirname, '..', 'skills', name));
  }

  loadSkills() {
    const paths = this
      .getPathsToInstalledSkills()
      .concat(this.getPathsToStandardSkills())
      .concat(this.getPathsToDevSkills());

    const skills = paths
      .reduce((s, p) => {
        const name = p.split(path.sep).pop();
        return {
          ...s,
          [name.replace('niles-', '')]: p,
        };
      }, {});

    this.installed = Object.entries(skills).map(([namespace, p]) => {
      // eslint-disable-next-line
      const skillGenerator = require(path.join(p, 'index.js'));
      const skill = new Skill(namespace);
      this.ctx.shell.ls(path.join(p, 'intents', '*.js')).forEach((file) => {
        const intentGenerator = require(file); // eslint-disable-line
        const actionPath = path.join(p, 'actions', path.basename(file));
        const intent = new Intent();

        intent.skill = skill;

        if (fs.existsSync(actionPath)) {
          const action = require(actionPath); // eslint-disable-line
          intent.does(action);
        }

        intentGenerator(intent);

        skill.intent(intent);
        skill.intent(help(intent));
      });
      return skillGenerator(skill);
    });
  }

  namespaces() {
    return this.installed.map(skill => skill.namespace);
  }

  getIntent(intentString) {
    const splitIntentString = intentString.split('.');

    if (splitIntentString.length < 2) {
      throw new Error('invalid skill intent format, use "namespace_name.intent_name(.anything_else?)"');
    }

    const intentNamespace = splitIntentString[0];
    const intentName = splitIntentString[1];
    const skill = this.installed.find(s => s.namespace === intentNamespace);

    if (!skill) {
      return null;
    }

    const intent = skill.intents.find(i => i.namespace === intentName);

    if (!intent) {
      throw new Error(`Intent "${intentName}" not found in skill "${intentNamespace}"`);
    }

    return intent;
  }
};
