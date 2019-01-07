const axios = require('axios');

const Context = require('./lib/context');
const devActions = require('./lib/dev');

class Niles {
  constructor() {
    this.ctx = new Context();
  }

  async init() {
    await this.ctx.load();
  }

  async translateDevCommand(command) {
    const actionName = command.split(' ')[0].split(':')[1];
    const skillName = command.split(' ')[1];
    const action = devActions[actionName];

    if (!action) {
      this.ctx.logger.log(`Wrong action: ${actionName}. Supported: ${Object.keys(devActions).join(', ')}`);
      return {
        action: null,
      };
    }

    return {
      description: `${actionName} on lib ${skillName}`,
      action: () => action.call(devActions, this.ctx, skillName),
    };
  }

  async translateCommand(command) {
    const rawQueryResults = await Promise.all(
      this.ctx.skills.namespaces().map(model => (async () => {
        const { data: query } = await axios.post(process.env.NLU_URL, {
          q: command,
          project: 'niles',
          model,
        });

        return query;
      })()),
    );
    const queryResults = rawQueryResults
      .filter(r => r.intent.name)
      .sort((a, b) => {
        if (a.intent.confidence > b.intent.confidence) {
          return -1;
        }

        if (a.intent.confidence === b.intent.confidence) {
          return 0;
        }

        return 1;
      });

    let intent;

    if (queryResults.length > 0) {
      intent = this.ctx.skills.getIntent(queryResults[0].intent.name);
    }

    return {
      queryResults,
      intent,
      action: intent ? () => intent.execute(queryResults[0].entities, this.ctx) : null,
      description: intent ? `Executing ${intent.skill.namespace}.${intent.namespace} (${queryResults[0].intent.confidence})
          ${queryResults[0].entities.map(entity => `${entity.entity}: ${entity.value} (${entity.confidence})`)}` : null,
    };
  }

  async q(command) {
    const { session, logger, analytics } = this.ctx;
    session.command = command;

    try {
      if (command.startsWith('dev:')) {
        session.dev = true;
      }

      Object.assign(
        session,
        await (session.dev ? this.translateDevCommand(command) : this.translateCommand(command)),
      );
      session.interpretedAt = Date.now();

      if (!session.action) {
        logger.log('I\'m afraid I can\'t do that');
      } else {
        logger.log(
          logger.chalk.dim(`\n---------------\nCommand: "${command}"`),
        );
        if (session.description) {
          logger.log(logger.chalk.dim(session.description));
        }
        logger.log(logger.chalk.dim('---------------\n'));

        session.startedAt = Date.now();
        session.result = await session.action.call(this);
        session.endedAt = Date.now();
      }
    } catch (error) {
      logger.error(error);
      session.error = error;
    } finally {
      session.save();
      session.track();

      await analytics.send();
    }
  }
}

module.exports = new Niles();
