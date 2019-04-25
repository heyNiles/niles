const shortid = require('shortid');

const Handler = require('./handler');

module.exports = class Scheduler extends Handler {
  constructor(ctx) {
    super(ctx);

    this.permissions = {
      MANAGE_SCHEDULED_TASKS: {
        name: 'manageScheduledTasks',
        description: 'manage scheduled tasks',
        usageConfirmation: (namespace, usageDescription) => `Allow skill ${namespace} to manage scheduled tasks, to ${usageDescription}?`,
        decorator: 'managesScheduledTasksTo',
        checker: 'canManageScheduledTasks',
      },
    };
  }

  async getTasks() {
    await this.assertPermission(this.permissions.MANAGE_SCHEDULED_TASKS);

    const {
      session: { intent: { skill: { namespace } } },
      db: { lowdb },
    } = this.ctx;

    return lowdb.get('tasks')
      .filter(task => task.name.split('.')[0] === namespace)
      .value();
  }

  async addTask(name, recurrence, options = {}) {
    await this.assertPermission(this.permissions.MANAGE_SCHEDULED_TASKS);

    const {
      session: { intent: { skill: { namespace } } },
      db: { lowdb },
    } = this.ctx;

    const task = {
      id: shortid.generate(),
      name: `${namespace}.${name}`,
      recurrence,
      options,
    };

    const existingTask = lowdb.get('tasks')
      .filter(t => t.name === task.name && Object.is(t.options || {}, task.options || {}))
      .value()[0];

    if (existingTask) {
      const error = new Error('Task already running');

      error.code = 400;
      throw error;
    }

    lowdb.get('tasks').push(task).write();
  }

  async removeTask(id) {
    await this.assertPermission(this.permissions.MANAGE_SCHEDULED_TASKS);

    const {
      session: { intent: { skill: { namespace } } },
      db: { lowdb },
    } = this.ctx;

    const task = lowdb.get('tasks')
      .filter(t => t.id === id)
      .value()[0];

    if (!task) {
      const error = new Error('Task not found');

      error.code = 404;
      throw error;
    }
    if (task.name.split('.')[0] !== namespace) {
      const error = new Error('Task not accessible');

      error.code = 401;
      throw error;
    }

    lowdb.get('tasks').remove(t => t.id === id).write();
  }
};
