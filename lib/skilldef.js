const Permissions = require('./permissions');

module.exports = class Skilldef {
  constructor(namespace, ctx) {
    this.namespace = namespace;
    this.ctx = ctx;
    this.description = [];
    this.aliases = [];
    this.permissionUsage = [];
    this.permissions = new Permissions(this.ctx);
    this.permissions.decorate(this);
  }

  can(description) {
    if (Array.isArray(description)) {
      this.description = [...this.description, ...description];
    } else {
      this.description.push(description);
    }
    return this;
  }

  ns(namespace) {
    this.namespace = namespace;
    return this;
  }

  expand(name, values) {
    let expandedValues = values;

    if (!Array.isArray(values)) {
      expandedValues = [];

      if (values.wordPattern) {
        expandedValues = expandedValues.concat([
          '~[_word]',
        ]);
      }
      if (values.filePathPattern) {
        expandedValues = expandedValues.concat([
          '~[_here]',
          '../~[_word]/~[_word]~[_digit?]~[_bla?].~[_extension]',
          '~[_word].~[_extension]',
          './~[_word]~[_digit?]~[_bla?]',
          './~[_word]~[_digit?]~[_bla?].~[_extension]',
          '~[_word]',
          './~[_bla]~[_digit]/~[_word]/~[_bla]~[_digit].~[_word].~[_extension]',
          '"../~[_word]/~[_word]~[_digit?]~[_bla?].~[_extension]"',
          '"~[_word].~[_extension]"',
          '"./~[_word]~[_digit?]~[_bla?]"',
          '"./~[_word]~[_digit?]~[_bla?].~[_extension]"',
          '"~[_word]"',
          '"./~[_bla]~[_digit]/~[_word]/~[_bla]~[_digit].~[_word].~[_extension]"',
        ]);
      }
      if (values.fileExtensionPattern) {
        expandedValues = expandedValues.concat([
          '~[.?]~[_extension]',
          'javascript', 'markdown', 'excel', 'circleci',
        ]);
      }
      if (values.textContentPattern) {
        expandedValues = expandedValues.concat([
          '"~[_word] ~[_word?] ~[_word?]"',
          '"~[_word]=~[_bla].~[_word]"',
        ]);
      }
      if (values.userPattern) {
        expandedValues = expandedValues.concat([
          '~[_word]', 'admin', 'me', 'ubuntu', 'root', 'test',
          'guest', 'info', 'adm', 'user', 'administrator',
        ]);
      }
      if (values.timePattern) {
        expandedValues = expandedValues.concat([
          'yesterday', 'today',
          'last ~[_time_interval#singular]',
          'this ~[_time_interval#singular]',
          '~[_digit] ~[_time_interval] ago',
          '~[_month] ~[_digit]~[_digit?]',
          '~[_month] ~[_digit]~[_digit?]th',
          'last ~[_day]',
          'last ~[_month]',
          '~[_digit]~[_digit?].~[1?]~[_digit].~[_year]',
          '~[_digit]~[_digit?]/~[1?]~[_digit]/~[_year]',
        ]);
      }
      if (values.numberPattern) {
        expandedValues = expandedValues.concat([
          '~[_digit]~[_digit?]~[_digit?]',
          '~[_digit]~[_digit?]~[_digit?].~[_digit]~[_digit?]~[_digit?]',
        ]);
      }
      if (values.fileNamePattern) {
        expandedValues = expandedValues.concat([
          '~[bla?]*~[_word].~[_extension]',
          '~[_word]*~[bla?].~[_extension]',
          '~[_word].*~[bla?]',
        ]);
      }
    }

    this.aliases = this.aliases.filter(a => a.name !== name);
    this.aliases.push({
      name,
      values: expandedValues,
    });
    return this;
  }

  alias(name, values) {
    return this.expand(`~[${name}]`, values);
  }

  slot(name, values) {
    return this.expand(`@[${name}]`, values);
  }
};
