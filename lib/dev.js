const path = require('path');
const fs = require('fs');

module.exports = {

  gendef: (ctx, skillName) => {
    ctx.logger.log('Generating chatito definitions...');

    if (skillName) {
      const skill = ctx.skills.installed.find(s => s.namespace === skillName);

      if (!skill) {
        throw new Error(`Skill "${skillName}" not found`);
      }

      skill.toChatito();
    } else {
      ctx.skills.installed.forEach(skill => skill.toChatito());
    }
  },

  gendata: async (ctx, skillName) => {
    ctx.logger.log('Generating training dataset...');
    const definitionsPath = path.join(__dirname, '..', 'definitions');
    const outputPath = path.join(__dirname, '..', 'dataset');
    const process = async (sn) => {
      ctx.logger.log(`    Generating ${sn} dataset`);
      ctx.shell.cd(path.join(definitionsPath, sn));

      const skillPath = path.join(outputPath, sn);

      if (!fs.existsSync(skillPath)) {
        fs.mkdirSync(skillPath);
      }

      await ctx.shell.execAsync(
        `npx chatito . --outputPath=${skillPath} --format=rasa`,
        { silent: false },
      );
    };

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    if (skillName) {
      await process(skillName);
    } else {
      await ctx.shell.ls(definitionsPath).reduce(async (p, s) => {
        await p;
        return process(s);
      }, Promise.resolve());
    }
  },

  preview: async (ctx, skillName) => {
    if (!skillName) {
      throw new Error('Must specify skill to preview');
    }

    ctx.logger.log('Previewing training dataset...');
    const datasetPath = path.join(__dirname, '..', 'dataset', skillName);

    ctx.shell.cd(datasetPath);
    await ctx.shell.execAsync('npx rasa-nlu-trainer --port=7321 --source=./rasa_dataset_training.json');
  },

  train: async (ctx, skillName) => {
    ctx.logger.log('Training...');
    const process = async (sn) => {
      ctx.logger.log(`    Training ${sn} dataset`);
      const datasetPath = path.join(__dirname, '..', 'dataset', sn);

      ctx.shell.cd(datasetPath);
      await ctx.shell.execAsync(
        `python3 -m rasa_nlu.train -c ../../nlu_config.yml --data ./rasa_dataset_training.json -o ../../models --fixed_model_name ${sn} --project niles --verbose`,
        { silent: false },
      );
    };

    if (skillName) {
      await process(skillName);
    } else {
      await ctx.shell.ls(path.join(__dirname, '..', 'dataset')).reduce(async (p, s) => {
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
    if (!skillName) {
      throw new Error('Must specify skill to evaluate');
    }

    ctx.logger.log('Evaluating training dataset...');
    const datasetPath = path.join(__dirname, '..', 'dataset', skillName);
    const evaluationPathRoot = path.join(__dirname, '..', 'evaluation');
    const evaluationPath = path.join(evaluationPathRoot, skillName);

    if (!fs.existsSync(evaluationPathRoot)) {
      fs.mkdirSync(evaluationPathRoot);
    }
    if (!fs.existsSync(evaluationPath)) {
      fs.mkdirSync(evaluationPath);
    }

    ctx.shell.cd(datasetPath);
    await ctx.shell.execAsync(
      `python3 -m rasa_nlu.evaluate --data ./rasa_dataset_testing.json --model ../../models/niles/${skillName} --errors=${evaluationPath}/errors.json --histogram=${evaluationPath}/hist.png --confmat=${evaluationPath}/confmat.png`,
      { silent: false },
    );
  },

  serve: async (ctx) => {
    ctx.shell.cd(path.join(__dirname, '..'));
    await ctx.shell.execAsync('npm run serve', { silent: false });
  },
};
