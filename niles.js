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
      action: () => {
        this.ctx.logger.log(`${actionName} on lib ${skillName}`);
        action.call(devActions, this.ctx, skillName);
      },
    };
  }

  async translateCommand(command) {
    const { skills } = this.ctx;
    let queryResults;

    const staticIntent = skills.installed.reduce(
      (a, skill) => [...a, ...skill.intents],
      [],
    ).find(i => i.commands.find(c => c.forms.includes(command)));

    if (staticIntent) {
      queryResults = [{
        intent: {
          name: `${staticIntent.skill.namespace}.${staticIntent.namespace}`,
          confidence: 1,
        },
        entities: [],
      }];
    } else {
      const { axios } = this.ctx;
      const devQueryResults = await Promise.all(
        this.ctx.skills.devNamespaces().map(model => (async () => {
          try {
            const { data: query } = await axios.post(
              process.env.NLU_LOCAL_URL || 'http://localhost:5000/parse',
              {
                q: command,
                project: 'niles',
                model,
              },
            );

            return query;
          } catch (error) {
            const { logger } = this.ctx;
            logger.warn(logger.chalk.dim.yellow(`Looks like dev server is down... (${error.message})`));
            return null;
          }
        })()),
      );

      let globalQueryResult;

      try {
        const { data } = await axios.post(
          process.env.NLU_GLOBAL_URL || 'http://localhost:5000/parse',
          {
            q: command,
            project: 'niles',
            model: 'general',
          },
        );

        globalQueryResult = data;
      } catch (error) {
        const { logger, analytics } = this.ctx;
        logger.warn(logger.chalk.dim.yellow(`Looks like I can't reach homebase... (${error.message})`));
        analytics.track('conn_error', { message: error.message });
      }

      queryResults = devQueryResults
        .concat([globalQueryResult])
        .filter(r => r && r.intent.name)
        .sort((a, b) => {
          if (a.intent.confidence > b.intent.confidence) {
            return -1;
          }

          if (a.intent.confidence === b.intent.confidence) {
            return 0;
          }

          return 1;
        });
    }

    let intent;
    let selectedResult;

    if (queryResults.length > 0) {
      [selectedResult] = queryResults;

      intent = this.ctx.skills.getIntent(selectedResult.intent.name);
    }

    return {
      queryResults,
      intent,
      action: intent ? () => {
        const { logger } = this.ctx;

        logger.trace(logger.chalk.dim('---------------'));
        logger.trace(logger.chalk.dim(
          `Executing ${intent.skill.namespace}.${intent.namespace} (${selectedResult.intent.confidence})`,
        ));
        logger.trace(logger.chalk.dim(
          `Entities: ${selectedResult.entities.map(entity => `${entity.entity}: ${entity.value} (${entity.confidence})`)}`,
        ));
        logger.trace(logger.chalk.dim(`Skipped ${
          queryResults.filter(qr => qr !== selectedResult).map(qr => `${qr.intent.name} (${qr.intent.confidence})`).join(', ')
        }`));
        logger.trace(logger.chalk.dim('---------------\n'));

        intent.execute(selectedResult.entities, this.ctx);
      } : null,
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
        logger.log('I\'m afraid I can\'t do that.');
      } else {
        session.startedAt = Date.now();
        session.result = await session.action.call(this);
      }
    } catch (error) {
      logger.error(error.message);
      session.error = error;
    } finally {
      session.endedAt = Date.now();
      session.save();
      session.track();

      await analytics.send();
    }
  }
}

module.exports = new Niles();
