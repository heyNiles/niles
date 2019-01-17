const notifier = require('node-notifier');
const path = require('path');

const Handler = require('./handler');

module.exports = class Notification extends Handler {
  constructor(ctx) {
    super(ctx);

    this.permissions = {
      SEND_OS_NOTIFICATION: {
        name: 'sendOSNotification',
        description: 'send os notification',
        usageConfirmation: (namespace, usageDescription) => `Allow skill "${namespace}" to send you notifications, in order to ${usageDescription}?`,
        decorator: 'sendsOSNotificationsTo',
        checker: 'canSendOSNotifications',
      },
    };
  }

  async send(options) {
    await this.assertPermission(this.permissions.SEND_OS_NOTIFICATION);

    return new Promise((resolve, reject) => {
      const { modulePath } = this.ctx;

      notifier.notify({
        title: 'Niles',
        ...(typeof options === 'string' ? { message: options } : options),
        icon: path.join(modulePath, 'assets', 'niles_notification.png'),
      }, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    });
  }
};
