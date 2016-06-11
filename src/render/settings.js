const h = require('snabbdom/h');
const { get: getState, updateSettings, updateUi } = require('../state');
const { unloadFiles } = require('../loader');

function closeSettings() {
  updateUi({ settings: false });
}

function addLogger(event) {
  event.preventDefault();
  updateSettings({ loggers: (getState().settings.loggers || []).concat([{ name: getState().ui.newLogger, color: '#000000', bg: '#000000' }]) });
  updateUi({ newLogger: '' });
}

function updateNewLogger(event) {
  updateUi({ newLogger: event.target.value });
}

function updateLoggerColor(name) {
  return function doUpdateLoggeColor(event) {
    updateSettings({ loggers: (getState().settings.loggers || []).map(logger => {
      if (logger.name === name) {
        return { name, color: event.target.value, bg: logger.bg };
      }
      return logger;
    }) });
  }
}

function updateLoggerBgColor(name) {
  return function doUpdateLoggerBgColor(event) {
    updateSettings({ loggers: (getState().settings.loggers || []).map(logger => {
      if (logger.name === name) {
        return { name, color: logger.color, bg: event.target.value };
      }
      return logger;
    }) });
  }
}

function removeFile(filename) {
  return function doRemoveFile() {
    updateSettings({ files: getState().settings.files.filter(f => f !== filename) });
    unloadFiles([filename]);
  }
}

function render(state) {
  return h('div#settings', { class: { opened: !!state.ui.settings } }, [
    h('div.mask', { on: { click: closeSettings } }, []),
    h('div.content', {}, [
      h('h3', {}, 'Loggers'),
      h('form', { on: { submit: addLogger } }, [
        h('input', { props: { type: 'text', value: state.ui.newLogger || '' }, on: { input: updateNewLogger } }),
        h('button', { props: { type: 'submit' }, style: { display: 'none' } }, [])
      ]),
      h('ul', {}, (state.settings.loggers || []).map(logger => h('li', {}, [
        h('span', {}, logger.name),
        h('input', { props: { type: 'color', value: logger.color || '' }, on: { input: updateLoggerColor(logger.name) } }),
        h('input', { props: { type: 'color', value: logger.bg || '' }, on: { input: updateLoggerBgColor(logger.name) } }),
      ]))),
      h('h3', {}, 'Watched files'),
      h('ul', {}, state.settings.files.map(file => h('li', { on: { click: removeFile(file) } }, file)))
    ])
  ]);
}

module.exports = {
  render
}
