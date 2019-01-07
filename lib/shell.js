const shelljs = require('shelljs');

shelljs.config.silent = true;

shelljs.execAsync = (command, options = {}) => new Promise((resolve, reject) => {
  const child = shelljs.exec(command, options, (code, stdout, stderr) => {
    if (code !== 0) {
      const err = new Error(stderr);
      err.code = code;
      return reject(err);
    }

    return resolve(stdout.split('\n').filter(line => line.length));
  });

  if (options.onStdoutData) {
    child.stdout.on('data', options.onStdoutData);
  }
  if (options.onStderrData) {
    child.stderr.on('data', options.onStderrData);
  }
});

shelljs.parseTree = (output, transform = e => e) => {
  const layout = (element) => {
    // eslint-disable-next-line no-param-reassign
    element.children = element.children.map(e => layout(e));

    return transform(element);
  };
  let currentLevel = 1;
  let currentParent = {
    value: 'root',
    parent: null,
    children: [],
  };
  let newElement;

  output.filter(line => line.length).forEach((line) => {
    const level = (line.match(/[├│└]/g) || []).length + (line.search(/\S/) / 2);

    if (level < currentLevel) {
      for (let i = 0; i < currentLevel - level; i += 1) {
        currentParent = currentParent.parent;
      }
    } else if (level > currentLevel) {
      currentParent = newElement;
    }

    newElement = {
      value: line.replace(/[├│└─┬]/g, '').trim(),
      parent: currentParent,
      children: [],
    };
    currentParent.children.push(newElement);

    currentLevel = level;
  });

  while (currentParent.parent) {
    currentParent = currentParent.parent;
  }

  return layout(currentParent);
};

module.exports = shelljs;
