const fs = require('fs');
const { observable, extendObservable, computed, action, autorun, observe, useStrict, asReference, asFlat } = require('mobx');

useStrict(true);

const { findFile: doFindFile, findLogger: doFindLogger, not, init: initLog, normalizeLoggers, normalizeSettings, compare, fullMatch, matchPath } = require('./log');
const { init: initPayload } = require('./payload');

function init(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    const value = JSON.parse(item);
    return Array.isArray(value) ? value : Object.assign(defaultValue, value);
  } catch (e) {
    localStorage.removeItem(key);
    return defaultValue;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const state = observable({
  logs: asFlat([]),
  // logs: asReference([]),
  files: init('files', []),
  filters: init('filters', {
    message: '',
    logger: '',
    from: null,
    to: null,
    levels: [],
    tags: []
  }),
  loggers: init('loggers', []),
  settings: init('settings', {
    payloadKey: '',
    payloadParse: false,
    timestampKey: ''
  }),
  ui: {
    settings: false,
    newLogger: '',
    lastFocus: new Date()
  }
});

const logs = computed(() => state.logs.filter(fullMatch(state.filters)));

function findFile(path) {
  return doFindFile(state.files)(path);
}

function findLogger(name) {
  return doFindLogger(state.loggers)(name);
}

const doNormalizeLoggers = action('normalizeLoggers', () => {
  console.log('Normalize loggers', JSON.parse(JSON.stringify(state.loggers)));
  state.logs = state.logs.map(normalizeLoggers(state.loggers));
});

const doNormalizeSettings = action('normalizeSettings', () => {
  console.log('Normalize settings', JSON.parse(JSON.stringify(state.settings)));
  state.logs = state.logs.map(normalizeSettings(state.settings, initPayload));
});

autorun('saveFiles', () => save('files', state.files));
autorun('saveFilters', () => save('filters', state.filters));
autorun('saveLoggers', () => save('loggers', state.loggers));
autorun('saveSettings', () => save('settings', state.settings));

const addLogs = action('addLogs', (path, logs) => {
  const file = findFile(path);
  if (file === undefined) { console.warn('Adding logs from an unexisting file'); return; }
  state.logs = logs.map(log => {
    return initLog(state.loggers, state.settings, initPayload, file)(log);
  }).sort(compare).concat(state.logs.slice());
});

const addFile = path => {
  fs.stat(path, action('addFile', (err, stats) => {
    if (err) { console.warn('Failed to add file'); console.error(err); return; }
    const file = findFile(path);
    if (file !== undefined) { console.warn('Adding an already existing file', path); return; }
    state.files = state.files.concat([{
      path: path,
      enabled: true,
      lastModified: stats.mtime,
      readUntil: 0,
      color: '#00000'
    }]);
  }));
};

const updateFile = action('updateFile', (path, patch) => {
  if (findFile(path) === undefined) { console.warn('Updating unexisting file', path, patch); return; }
  state.files = state.files.map(file => file.path === path ? Object.assign(file, patch) : file);
});

const removeFile = action('removeFile', path => {
  const file = findFile(path);
  if (file === undefined) { console.warn('Removing unexisting file', path); return; }
  state.logs = state.logs.filter(not(matchPath(path)));
  state.files = state.files.filter(f => f.path !== path);
});

const postClearFile = action('clearFile', file => {
  state.logs = state.logs.filter(not(matchPath(file.path)));
  updateFile(file.path, { readUntil: 0, lastModified: new Date() });
});

const clearFile = path => {
  const file = findFile(path);
  if (file === undefined) { console.warn('Clearing unexisting file', path); return; }

  fs.open(path, 'w', (err) => {
    if (err) {
      console.warn('Failed to clear file', path);
      console.error(e);
      return;
    }
    postClearFile(file);
  });
};

const updateFilters = action('updateFilters', (patch) => {
  state.filters = Object.assign({}, state.filters, patch);
});

const addLogger = action('addLogger', (newLogger) => {
  const logger = findLogger(newLogger.name);
  if (logger !== undefined) { console.warn('Adding an already existing logger', newLogger); return; }
  state.loggers = state.loggers.concat([newLogger]);
  doNormalizeLoggers();
});

const updateLogger = action('updateLogger', (name, patch) => {
  if (findLogger(name) === undefined) { console.warn('Updating unexisting logger', name, patch); return; }
  state.loggers = state.loggers.map(logger => logger.name === name ? Object.assign(logger, patch) : logger);
});

const removeLogger = action('removeLogger', (name) => {
  const logger = findLogger(name);
  if (logger === undefined) { console.warn('Removing unexisting logger', name); return; }
  state.loggers = state.loggers.filter(l => l.name !== name);
  doNormalizeLoggers();
});

const updateUI = action('updateUI', (patch) => {
  Object.assign(state.ui, patch);
});

const updateSettings = action('updateSettings', (patch) => {
  Object.assign(state.settings, patch);
  doNormalizeSettings();
});

module.exports = {
  state,
  logs,
  findFile,
  findLogger,
  addLogs,
  addFile,
  updateFile,
  removeFile,
  clearFile,
  updateFilters,
  addLogger,
  updateLogger,
  removeLogger,
  updateUI,
  updateSettings,
};
