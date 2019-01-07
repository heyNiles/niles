const Skilldef = require('./skilldef');

module.exports = class Skill extends Skilldef {
  constructor(namespace) {
    super(namespace);
    this.intents = [];
    this.aliases = [
      { name: '~[_letter]', values: 'abcdefghijklmnopqrstuvwxyz'.split('') },
      { name: '~[_digit]', values: '1234567890'.split('') },
      { name: '~[_bla]', values: ['~[_letter]~[_letter]~[_letter]~[_letter?]~[_letter?]'] },
      { name: '~[_word]', values: ['~[_bla]~[_bla]'] },
      { name: '~[_dir]', values: ['dir', 'directory', 'folder'] },
      { name: '~[_here]', values: ['here', 'this ~[_dir]'] },
      { name: '~[_extension]', values: ['js', 'md', 'php', 'xls'] },
      { name: '~[_time_interval]', values: ['weeks', 'days', 'months', 'years', 'minutes', 'hours'] },
      { name: '~[_time_interval#singular]', values: ['week', 'day', 'month', 'year', 'minute', 'hour'] },
      {
        name: '~[_day]',
        values: [
          'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
          'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'day',
        ],
      },
      {
        name: '~[_month]',
        values: [
          'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
          'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr',
          'may', 'jun', 'jul', 'aug', 'sept', 'oct', 'nov', 'dec', 'month',
        ],
      },
      {
        name: '~[_year]',
        values: [
          '19~[_digit]~[_digit]',
          '20~[_digit]~[_digit]',
        ],
      },
    ];
  }

  intent(intent) {
    intent.skill = this; // eslint-disable-line no-param-reassign
    this.intents.push(intent);
    return this;
  }

  toChatito() {
    this.intents.forEach(intent => intent.toChatito());
  }
};
