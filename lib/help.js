const Intent = require('./intent');

module.exports = (intent) => {
  const helpIntent = new Intent(`${intent.namespace}_help`, intent.ctx)
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
      const currentIntent = ctx.session.intent;
      const targetedIntent = ctx.skills.getIntent(
        `${currentIntent.skill.namespace}.${currentIntent.namespace.replace('_help', '')}`,
      );

      ctx.logger.log(`I can ${targetedIntent.description[0]} - ask me something like:`);
      targetedIntent.cmdExamples.forEach((example) => {
        ctx.logger.log(`  • "${example}"`);
      });
    });

  helpIntent.aliases = [...helpIntent.aliases, ...intent.aliases];
  helpIntent.skipHelp = true;

  return helpIntent;
};
