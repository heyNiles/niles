const fs = require('fs');
const path = require('path');
const Skilldef = require('./skilldef');

module.exports = class Intent extends Skilldef {
  constructor(namespace, ctx) {
    super(namespace, ctx);

    this.skill = null;
    this.cmdExamples = [];
    this.action = null;
    this.commands = [];
    this.skipHelp = false;
  }

  examples(examples) {
    if (Array.isArray(examples)) {
      this.cmdExamples = [...this.cmdExamples, ...examples];
    } else {
      this.cmdExamples.push(examples);
    }
    return this;
  }

  does(action) {
    this.action = action;
    return this;
  }

  skipHelpListing() {
    this.skipHelp = true;
    return this;
  }

  execute(params, ctx) {
    if (this.action) {
      this.action(
        params.reduce((a, param) => ({
          ...a,
          [param.entity]: param,
        }), {}),
        ctx,
      );
      ctx.logger.log('');
    }
  }

  command(forms, { test = 20, train = 200, ...rest } = {}) {
    this.commands.push({
      options: {
        test,
        train,
        ...rest,
      },
      forms,
    });

    return this;
  }

  toChatito() {
    let components = this.commands.map((c) => {
      const options = [];
      const fullNamespace = [this.skill.namespace, this.namespace];

      if (c.options.train) {
        options.push(`'training':'${c.options.train}'`);
      }
      if (c.options.test) {
        options.push(`'testing':'${c.options.test}'`);
      }
      if (c.options.type) {
        fullNamespace.push(c.options.type);
      }

      return `%[${fullNamespace.join('.')}]${options.length ? `(${options.join(',')})` : ''}\n${
        c.forms.map(form => `    ${form}`).join('\n')
      }`;
    });

    components = components.concat(
      this.skill.aliases
        .filter(alias => !this.aliases.map(a => a.name).includes(alias.name))
        .concat(this.aliases)
        .map(alias => `${alias.name}\n${
          alias.values.map(value => `    ${value}`).join('\n')
        }`),
    );

    const definitionPath = path.join(__dirname, '..', 'definitions', this.skill.namespace);

    if (!fs.existsSync(path.join(__dirname, '..', 'definitions'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'definitions'));
    }
    if (!fs.existsSync(definitionPath)) {
      fs.mkdirSync(definitionPath);
    }

    fs.writeFileSync(
      path.join(definitionPath, `${this.skill.namespace}.${this.namespace}.chatito`),
      components.join('\n'),
    );

    return this;
  }
};
