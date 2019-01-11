const { table, getBorderCharacters } = require('table');

table.borderless = (data, padding = 2, config = {}) => table(
  data,
  Object.assign(
    config,
    {
      border: getBorderCharacters('void'),
      columnDefault: {
        ...(config.columnDefault || {}),
        paddingLeft: 0,
        paddingRight: padding,
      },
      drawHorizontalLine: () => false,
    },
  ),
);

table.template = (data, template = 'ramac', config = {}) => table(data, {
  ...config,
  border: getBorderCharacters(template),
});

module.exports = table;
