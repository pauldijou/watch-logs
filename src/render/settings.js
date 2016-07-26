const h = require('snabbdom/h');
const { dialog } = require('electron').remote;
const { state, updateUI, updateSettings, addLogger, updateLogger, removeLogger, updateFile, clearFile } = require('../state');
const { watch, unwatch } = require('../watcher');

function closeSettings() {
  updateUI({ settings: false });
}

const updatePayloadKey = event => {
  updateSettings({ payloadKey: event.target.value });
};

const updatePayloadParse = event => {
  updateSettings({ payloadParse: event.target.checked });
};

const updateTimestampKey = event => {
  updateSettings({ timestampKey: event.target.value });
};

const submitNewLogger = event => {
  event.preventDefault();
  addLogger({ name: state.ui.newLogger, color: '#000000', bgColor: '#ffffff', bgOpacity: 1, enabled: true });
  updateUI({ newLogger: '' });
}

const updateNewLogger = event => {
  updateUI({ newLogger: event.target.value });
};

const updateLoggerColor = logger => event => {
  updateLogger(logger.name, { color: event.target.value });
};

const updateLoggerBgColor = logger => event => {
  updateLogger(logger.name, { bgColor: event.target.value });
};

const updateLoggerBgOpacity = logger => event => {
  updateLogger(logger.name, { bgOpacity: event.target.value });
};

const updateLoggerEnabled = logger => event => {
  updateLogger(logger.name, { enabled: event.target.checked });
};

const doRemoveLogger = logger => event => {
  removeLogger(logger.name);
}

function showLoadFiles() {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections']
  }, (filenames) => {
    if (!filenames) { return; }
    watch(filenames);
  });
}

const updateFileEnabled = file => event => {
  updateFile(file.path, { enabled: event.target.checked });
};

const updateFileColor = file => event => {
  updateFile(file.path, { color: event.target.value });
};

const removeFile = file => () => {
  unwatch([file.path]);
};

const doClearFile = file => () => {
  clearFile(file.path);
};

function render() {
  return h('div#settings', { class: { opened: !!state.ui.settings } }, [
    h('div.mask', { on: { click: closeSettings } }, []),
    h('div.content', {}, [
      h('h3', {}, 'Settings'),
      h('div', {}, [
        h('label', {}, 'Payload key'),
        h('input', { attrs: { type: 'text', value: state.settings.payloadKey }, on: { change: updatePayloadKey } }, []),
      ]),
      h('div', {}, [
        h('label', {}, 'Payload parsing'),
        h('input', { attrs: { type: 'checkbox', checked: state.settings.payloadParse }, on: { change: updatePayloadParse } }, []),
      ]),
      h('div', {}, [
        h('label', {}, 'Timestamp key'),
        h('input', { attrs: { type: 'text', value: state.settings.timestampKey }, on: { change: updateTimestampKey } }, []),
      ]),
      h('h3', {}, 'Watched files'),
      h('button', { attrs: { type: 'button' }, on: { click: showLoadFiles } }, 'Load'),
      h('ul.files', {}, state.files.map(file => h('li', {}, [
        h('input', { attrs: { type: 'checkbox', checked: file.enabled }, on: { change: updateFileEnabled(file) } }, []),
        h('input', { attrs: { type: 'color', value: file.color || '' }, on: { change: updateFileColor(file) } }, []),
        h('span', {}, file.path),
        h('button', { attrs: { type: 'button' }, on: { click: doClearFile(file) } }, 'Clear'),
        h('button', { attrs: { type: 'button' }, on: { click: removeFile(file) } }, 'Remove'),
      ]))),
      h('h3', {}, 'Loggers'),
      h('form', { on: { submit: submitNewLogger } }, [
        h('input', { attrs: { type: 'text', value: state.ui.newLogger || '' }, on: { input: updateNewLogger } }),
        h('button', { attrs: { type: 'submit' } }, 'Add ' + state.ui.newLogger)
      ]),
      h('ul.loggers', {}, state.loggers.map(logger => h('li', {}, [
        h('input', { attrs: { type: 'checkbox', checked: logger.enabled }, on: { change: updateLoggerEnabled(logger) } }, []),
        h('input', { attrs: { type: 'color', value: logger.color || '' }, on: { change: updateLoggerColor(logger) } }, []),
        h('input', { attrs: { type: 'color', value: logger.bgColor || '' }, on: { change: updateLoggerBgColor(logger) } }, []),
        h('input', { attrs: { type: 'range', value: logger.bgOpacity || 1, min: 0, max: 1, step: 0.1 }, on: { change: updateLoggerBgOpacity(logger) } }, []),
        h('span', {}, logger.name),
        h('button', { attrs: { type: 'button' }, on: { click: doRemoveLogger(logger) } }, 'Remove')
      ]))),
    ])
  ]);
}

module.exports = {
  render
}
