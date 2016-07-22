const h = require('snabbdom/h');
const { state, updateUI, addLogger, updateLogger } = require('../state');
const { unwatch } = require('../watcher');

function closeSettings() {
  updateUI({ settings: false });
}

const submitNewLogger = state => event => {
  event.preventDefault();
  addLogger({ name: state.ui.newLogger, color: '#000000', bgColor: '#ffffff', enabled: true });
  updateUI({ newLogger: '' });
}

function updateNewLogger(event) {
  updateUI({ newLogger: event.target.value });
}

function updateLoggerColor(logger) {
  return function doUpdateLoggeColor(event) {
    updateLogger(logger.name, { color: event.target.value });
  }
}

function updateLoggerBgColor(logger) {
  return function doUpdateLoggerBgColor(event) {
    updateLogger(logger.name, { bgColor: event.target.value });
  }
}

function updateLoggerEnabled(logger) {
  return function doUpdateLoggerEnabled(event) {
    updateLogger(logger.name, { enabled: event.target.checked });
  }
}

function removeFile(file) {
  return function doRemoveFile() {
    unwatch([file.path]);
  };
}

function render() {
  return h('div#settings', { class: { opened: !!state.ui.settings } }, [
    h('div.mask', { on: { click: closeSettings } }, []),
    h('div.content', {}, [
      h('h3', {}, 'Loggers'),
      h('form', { on: { submit: submitNewLogger(state) } }, [
        h('input', { attrs: { type: 'text', value: state.ui.newLogger || '' }, on: { input: updateNewLogger } }),
        h('button', { attrs: { type: 'submit' }, style: { display: 'none' } }, [])
      ]),
      h('ul', {}, state.loggers.map(logger => h('li', {}, [
        h('input', { attrs: { type: 'checkbox', checked: logger.enabled }, on: { change: updateLoggerEnabled(logger) } }, []),
        h('input', { attrs: { type: 'color', value: logger.color || '' }, on: { change: updateLoggerColor(logger) } }),
        h('input', { attrs: { type: 'color', value: logger.bgColor || '' }, on: { change: updateLoggerBgColor(logger) } }),
        h('span', {}, logger.name),
      ]))),
      h('h3', {}, 'Watched files'),
      h('ul', {}, state.files.map(file => h('li', { on: { click: removeFile(file) } }, file.path)))
    ])
  ]);
}

module.exports = {
  render
}
