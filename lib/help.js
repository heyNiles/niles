const Intent = require('./intent');

module.exports = (intent) => {
  const helpIntent = new Intent(`${intent.namespace}_help`)
    .can('help out with usage')
    .can('provide command examples')
    .command([
      'help ~[me?] @[help_ability]',
      'can ~[h_you] @[help_ability]',
    ], { train: 0, test: 0 })
    .command([
      'can I ask ~[h_you] to @[help_ability]',
      '~[do?] ~[h_you] know ~[how?] to @[help_ability]',
      '~[are?] ~[h_you] able to @[help_ability]',
      '~[h_commands] to @[help_ability]',
      '~[h_show] ~[me?] ~[some?] ~[h_commands] to @[help_ability]',
    ], { train: 0, test: 10, type: 'advanced' })
    .slot('help_ability', intent.description)
    .alias('h_commands', ['commands', 'command examples', 'command samples'])
    .alias('h_you', ['you', 'u'])
    .alias('h_show', ['show', 'display', 'list', 'give'])
    .does((params, ctx) => {
      ctx.logger.log(`I can ${ctx.intent.description[0]} - ask me something like:`);
      ctx.intent.cmdExamples.forEach((example) => {
        ctx.logger.log(`  • "${example}"`);
      });
    });

  helpIntent.aliases = [...helpIntent.aliases, ...intent.aliases];

  return helpIntent;
};
