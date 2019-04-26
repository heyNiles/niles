const path = require('path');
const http = require('http');
const url = require('url');

const Handler = require('./handler');

module.exports = class OAuthLogin extends Handler {
  constructor(ctx) {
    super(ctx);

    this.adapters = this.ctx.shell.ls(path.join(__dirname, 'login'))
      .reduce((o, file) => ({
        ...o,
        [path.basename(file, '.js')]: require(path.join(__dirname, 'login', file)), // eslint-disable-line
      }), {});
    this.permissions = Object.keys(this.adapters).reduce((o, key) => ({
      ...o,
      ...this.adapters[key].permissions,
    }), {});
  }

  async authenticateWith({ adapterName, adapterParams = {} }) {
    return new Promise(async (resolve, reject) => {
      const adapter = this.adapters[adapterName];

      await this.assertPermission(adapter.permissions[Object.keys(adapter.permissions)[0]]);

      const { open } = this.ctx;
      const server = http.createServer((request, response) => {
        const { query } = url.parse(request.url);

        adapter.onQuery(query, adapterParams, (data, err) => {
          if (err) {
            reject(new Error(err));
          } else {
            resolve(data);
          }
          response.end('<html><body>Thanks! You can go back to the terminal now.</body></html>');
          server.close();
        });
        response.end();
      });

      server.listen(50726, async (err) => {
        if (err) {
          reject(err.message);
          server.close();
          return;
        }
        setTimeout(async () => {
          await open(adapter.authorizationEndpoint(adapterParams));
        }, 500);
      });
    });
  }
};
