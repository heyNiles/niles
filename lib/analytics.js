const Segment = require('analytics-node');
const os = require('os');
const packagejson = require('../package.json');

const segment = new Segment(process.env.SEGMENT_WRITE_KEY);

module.exports = class Analytics {
  constructor(ctx) {
    this.ctx = ctx;
    this.events = [];
  }

  track(event, properties = {}) {
    this.events.push({
      event,
      properties: {
        nilesVersion: packagejson.version,
        nodeVersion: this.ctx.handlers.node.getVersion(),
        os: `${os.arch()} ${os.type()} ${os.platform()} ${os.release()}`,
        ...properties,
      },
    });
  }

  async send() {
    return new Promise((resolve, reject) => {
      this.events.forEach(event => segment.track({
        anonymousId: this.ctx.db.profile().id,
        ...event,
      }));

      segment.flush((err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    });
  }
};
