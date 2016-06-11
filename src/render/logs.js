const h = require('snabbdom/h');
const { getClock, matchLogger, fullMatch } = require('../log');
const { get: getState, updateSettings, updateUi } = require('../state');

const keys = [ '' ]

function hexToRgba(hex, a) {
  const num = parseInt(hex.slice(1), 16);
  return `rgba(${num >> 16}, ${num >> 8 & 255}, ${num & 255}, ${a})`;
}

function toggle(log) {
  return function doToggleLog() {
    const state = getState();
    if (isOpen(state, log)) {
      updateUi({ openedLogs: state.ui.openedLogs.filter(l => l !== log) });
    } else {
      updateUi({ openedLogs: state.ui.openedLogs.concat([log]) });
    }
  }
}

function isOpen(state, log) {
  return state.ui.openedLogs.indexOf(log) >= 0;
}

function render(state) {
  return h('ul#logs', {}, state.logs.filter(fullMatch(state.filters)).map(log => {
    const style = (state.settings.loggers || []).reduce((acc, logger) => {
      return acc || (matchLogger(logger.name)(log) && { color: logger.color, backgroundColor: hexToRgba(logger.bg, '0.5') })
    }, false);

    return h('li.log.' + (log.level || 'info'), { style: style || {}, on: { click: toggle(log) } }, [
      h('div.level', {}, getClock(log)),
      h('div.message', {}, log.message),
      h('div.details', { style: { display: isOpen(state, log) ? 'block' : 'none' } }, 'YO')
    ]);
  }));
}

module.exports = {
  render
};
