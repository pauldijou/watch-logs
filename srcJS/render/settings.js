const h = require('snabbdom/h');
const { dialog } = require('electron').remote;
const { state, updateUI, updateSettings, addLogger, updateLogger, removeLogger, addLevel, updateLevel, removeLevel, updateFile, clearFile } = require('../state');
const { watch, unwatch } = require('../watcher');

function closeSettings() {
  updateUI({ settings: false });
}

// Settings -------------------

const updatePayloadKey = event => {
  updateSettings({ payloadKey: event.target.value });
};

const updatePayloadParse = event => {
  updateSettings({ payloadParse: event.target.checked });
};

const updateTimestampKey = event => {
  updateSettings({ timestampKey: event.target.value });
};

const updateUserKey = event => {
  updateSettings({ userKey: event.target.value });
};

const updateLevelKey = event => {
  updateSettings({ levelKey: event.target.value });
};

const updateLoggerKey = event => {
  updateSettings({ loggerKey: event.target.value });
};

function renderSettings() {
  return [
    h('h3', {}, 'Settings'),
    h('div', {}, [
      h('label', {}, 'Payload key'),
      h('input', { props: { type: 'text', value: state.settings.payloadKey }, on: { change: updatePayloadKey } }, []),
    ]),
    h('div', {}, [
      h('label', {}, 'Payload parsing'),
      h('input', { props: { type: 'checkbox', checked: state.settings.payloadParse }, on: { change: updatePayloadParse } }, []),
    ]),
    h('div', {}, [
      h('label', {}, 'Timestamp key'),
      h('input', { props: { type: 'text', value: state.settings.timestampKey }, on: { change: updateTimestampKey } }, []),
    ]),
    h('div', {}, [
      h('label', {}, 'User key'),
      h('input', { props: { type: 'text', value: state.settings.userKey }, on: { change: updateUserKey } }, []),
    ]),
    h('div', {}, [
      h('label', {}, 'Level key'),
      h('input', { props: { type: 'text', value: state.settings.levelKey }, on: { change: updateLevelKey } }, []),
    ]),
    h('div', {}, [
      h('label', {}, 'Logger key'),
      h('input', { props: { type: 'text', value: state.settings.loggerKey }, on: { change: updateLoggerKey } }, []),
    ]),
  ];
}

// Loggers -----------------------

const submitNewLogger = event => {
  event.preventDefault();
  addLogger({
    name: state.ui.newLogger,
    color: '#000000',
    bgColor: '#ffffff',
    bgOpacity: 1,
    enabled: true
  });
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
};

function renderLoggers() {
  return [
    h('h3', {}, 'Loggers'),
    h('form', { on: { submit: submitNewLogger } }, [
      h('input', { attrs: { type: 'text' }, props: { value: state.ui.newLogger || '' }, on: { input: updateNewLogger } }),
      h('button', { attrs: { type: 'submit' } }, 'Add')
    ]),
    h('ul.loggers', {}, state.loggers.map(logger => h('li', {}, [
      h('input', { attrs: { type: 'checkbox' }, props: { checked: logger.enabled }, on: { change: updateLoggerEnabled(logger) } }, []),
      h('input', { attrs: { type: 'color' }, props: { value: logger.color || '' }, on: { change: updateLoggerColor(logger) } }, []),
      h('input', { attrs: { type: 'color' }, props: { value: logger.bgColor || '' }, on: { change: updateLoggerBgColor(logger) } }, []),
      h('input', { attrs: { type: 'range' }, props: { value: logger.bgOpacity || 1, min: 0, max: 1, step: 0.1 }, on: { change: updateLoggerBgOpacity(logger) } }, []),
      h('span', {}, logger.name),
      h('button', { props: { type: 'button' }, on: { click: doRemoveLogger(logger) } }, 'Remove')
    ]))),
  ];
}

// Levels ------------------------------

const submitNewLevel = event => {
  event.preventDefault();
  addLevel({
    name: state.ui.newLevelName,
    severity: state.ui.newLevelSeverity,
    color: '#000000',
    enabled: true
  });
  updateUI({ newLevelName: '', newLevelSeverity: 0 });
};

const updateNewLevelName = event => {
  updateUI({ newLevelName: event.target.value });
};

const updateNewLevelSeverity = event => {
  updateUI({ newLevelSeverity: parseInt(event.target.value, 10) });
};

const updateLevelEnabled = level => event => {
  updateLevel(level.name, { enabled: event.target.checked });
};

const updateLevelColor = level => event => {
  updateLevel(level.name, { color: event.target.value });
};

const updateLevelSeverity = level => event => {
  updateLevel(level.name, { severity: parseInt(event.target.value, 10) });
};

const doRemoveLevel = level => event => {
  removeLevel(level.name);
};

function renderLevels() {
  return [
    h('h3', {}, 'Levels'),
    h('form', { on: { submit: submitNewLevel } }, [
      h('input', { attrs: { type: 'text' }, props: { value: state.ui.newLevelName || '' }, on: { input: updateNewLevelName } }),
      h('input', { attrs: { type: 'number' }, props: { value: state.ui.newLevelSeverity || 0 }, on: { input: updateNewLevelSeverity } }),
      h('button', { attrs: { type: 'submit' } }, 'Add')
    ]),
    h('ul.levels', {}, state.levels.map(level => h('li', {}, [
      h('input', { attrs: { type: 'checkbox' }, props: { checked: level.enabled }, on: { change: updateLevelEnabled(level) } }, []),
      h('input', { attrs: { type: 'number' }, props: { value: level.severity || 0 }, on: { input: updateLevelSeverity } }),
      h('input', { attrs: { type: 'color' }, props: { value: level.color || '' }, on: { change: updateLevelColor(level) } }, []),
      h('span', {}, level.name),
      h('button', { attrs: { type: 'button' }, on: { click: doRemoveLevel(level) } }, 'Remove')
    ]))),
  ];
}


// Files ------------------------------------

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

function renderFiles() {
  return [
    h('h3', {}, 'Watched files'),
    h('button', { attrs: { type: 'button' }, on: { click: showLoadFiles } }, 'Load'),
    h('ul.files', {}, state.files.map(file => h('li', {}, [
      h('input', { attrs: { type: 'checkbox' }, props: { checked: file.enabled }, on: { change: updateFileEnabled(file) } }, []),
      h('input', { attrs: { type: 'color'}, props: { value: file.color || '' }, on: { change: updateFileColor(file) } }, []),
      h('span', {}, file.path),
      h('button', { attrs: { type: 'button' }, on: { click: doClearFile(file) } }, 'Clear'),
      h('button', { attrs: { type: 'button' }, on: { click: removeFile(file) } }, 'Remove'),
    ]))),
  ];
}

// Rendering --------------------------------------

function render() {
  return h('div#settings', { class: { opened: !!state.ui.settings } }, [
    h('div.mask', { on: { click: closeSettings } }, []),
    h('div.content', {}, [].concat(
      renderSettings(),
      renderFiles(),
      renderLoggers(),
      renderLevels()
    )),
  ]);
}

module.exports = {
  render
}
