const path = require('path');
const fs = require('fs');

module.exports = {

  new: (ctx, skillName) => {
    const { logger } = ctx;

    if (!skillName) {
      throw new Error('Skill name required');
    }

    logger.log(`Creating a new "${skillName}" skill...`);
  },

  gendef: (ctx, skillName) => {
    const { logger, skills } = ctx;

    logger.log('Generating chatito definitions...');

    if (skillName && skillName !== 'general') {
      const skill = skills.installed.find(s => s.namespace === skillName);

      if (!skill) {
        throw new Error(`Skill "${skillName}" not found`);
      }

      skill.toChatito();
    } else {
      skills.installed.forEach(skill => skill.toChatito());
    }
  },

  gendata: async (ctx, skillName) => {
    const { logger, shell } = ctx;
    const definitionsPath = path.join(__dirname, '..', 'definitions');
    const outputPath = path.join(__dirname, '..', 'dataset');
    const process = async (sn) => {
      logger.log(`    Generating ${sn} dataset`);
      if (sn !== 'general') {
        shell.cd(path.join(definitionsPath, sn));
      } else {
        shell.cd(definitionsPath);
      }

      const skillPath = path.join(outputPath, sn);

      if (!fs.existsSync(skillPath)) {
        fs.mkdirSync(skillPath);
      }

      await shell.execAsync(
        `npx chatito . --outputPath=${skillPath} --format=rasa`,
        { silent: false },
      );
    };

    logger.log('Generating training dataset...');

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    if (skillName) {
      await process(skillName);
    } else {
      await shell.ls(definitionsPath).reduce(async (p, s) => {
        await p;
        return process(s);
      }, Promise.resolve());
    }
  },

  preview: async (ctx, skillName) => {
    const { logger, shell } = ctx;

    if (!skillName) {
      throw new Error('Must specify skill to preview');
    }

    logger.log('Previewing training dataset...');
    const datasetPath = path.join(__dirname, '..', 'dataset', skillName);

    shell.cd(datasetPath);
    await shell.execAsync('npx rasa-nlu-trainer --port=7321 --source=./rasa_dataset_training.json');
  },

  train: async (ctx, skillName) => {
    const { logger, shell } = ctx;

    logger.log('Training...');
    const process = async (sn) => {
      logger.log(`    Training ${sn} dataset`);
      const datasetPath = path.join(__dirname, '..', 'dataset', sn);

      shell.cd(datasetPath);
      await shell.execAsync(
        `python3 -m rasa_nlu.train -c ../../nlu_config.yml --data ./rasa_dataset_training.json -o ../../models --fixed_model_name ${sn} --project niles --verbose`,
        { silent: false },
      );
    };

    if (skillName) {
      await process(skillName);
    } else {
      await shell.ls(path.join(__dirname, '..', 'dataset')).reduce(async (p, s) => {
        await p;
        return process(s);
      }, Promise.resolve());
    }
  },

  async gen(ctx, skillName) {
    await this.gendef(ctx, skillName);
    await this.gendata(ctx, skillName);
  },

  async build(ctx, skillName) {
    await this.gendef(ctx, skillName);
    await this.gendata(ctx, skillName);
    await this.train(ctx, skillName);
  },

  eval: async (ctx, skillName) => {
    const { logger, shell } = ctx;

    if (!skillName) {
      throw new Error('Must specify skill to evaluate');
    }

    logger.log('Evaluating training dataset...');
    const datasetPath = path.join(__dirname, '..', 'dataset', skillName);
    const evaluationPathRoot = path.join(__dirname, '..', 'evaluation');
    const evaluationPath = path.join(evaluationPathRoot, skillName);

    if (!fs.existsSync(evaluationPathRoot)) {
      fs.mkdirSync(evaluationPathRoot);
    }
    if (!fs.existsSync(evaluationPath)) {
      fs.mkdirSync(evaluationPath);
    }

    shell.cd(datasetPath);
    await ctx.shell.execAsync(
      `python3 -m rasa_nlu.evaluate --data ./rasa_dataset_testing.json --model ../../models/niles/${skillName} --errors=${evaluationPath}/errors.json --histogram=${evaluationPath}/hist.png --confmat=${evaluationPath}/confmat.png`,
      { silent: false },
    );
  },

  serve: async (ctx) => {
    const { shell } = ctx;

    shell.cd(path.join(__dirname, '..'));
    await shell.execAsync('npm run serve', { silent: false });
  },
};
