const h = require('snabbdom/h');
const { state, logs } = require('../state');
const { getClock, matchLogger, fullMatch, isOpen, toggle } = require('../log');

const keys = [ '' ]

function hexToRgba(hex, a) {
  const num = parseInt(hex.slice(1), 16);
  return `rgba(${num >> 16}, ${num >> 8 & 255}, ${num & 255}, ${a})`;
}

function handleToggle(log) {
  return function doHandleToggle() {
    toggle(log);
  }
}

function render() {
  return h('ul#logs', {}, logs.get().filter(fullMatch(state.filters)).map(log => {
    const style = state.loggers.reduce((acc, logger) => {
      return acc || (matchLogger(logger.name)(log) && { color: logger.color, backgroundColor: hexToRgba(logger.bg, '0.5') })
    }, false);

    return h('li.log.' + (log.level || 'info'), { style: style || {}, on: { click: handleToggle(log) } }, [
      h('div.level', {}, getClock(log)),
      h('div.message', {}, log.message),
      h('div.details', { style: { display: isOpen(log) ? 'block' : 'none' } }, 'YO')
    ]);
  }));
}

module.exports = {
  render
};
