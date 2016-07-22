const fs = require('fs');
const { observable, extendObservable, computed, action, autorun, observe, useStrict } = require('mobx');

useStrict(true);

const { init: initLog, normalize, fullMatch, matchPath } = require('./log');

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
  logs: [],
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
  ui: {
    settings: false,
    newLogger: '',
  }
});

const logs = computed(() => state.logs.filter(fullMatch(state.filters)));

function findFile(path) {
  return state.files.find(file => file.path === path);
}

function findLogger(name) {
  return state.loggers.find(logger => logger.name === name);
}

const normalizeLogs = action('normalizeLogs', () => {
  state.logs = state.logs.map(normalize(state.files, state.loggers));
});

observe(state.files, change => {
  console.log('change files', change);
  normalizeLogs();
});

observe(state.loggers, change => {
  console.log('change loggers', change);
  normalizeLogs();
});

autorun('saveFiles', () => save('files', state.files));
autorun('saveFilters', () => save('filters', state.filters));
autorun('saveLoggers', () => save('loggers', state.loggers));

const addLogs = action('addLogs', (path, logs) => {
  const file = findFile(path);
  state.logs = (logs.map(initLog(state.files, state.loggers, file))).concat(state.logs.slice());
});

const addFile = path => {
  fs.stat(path, action('addFile', (err, stats) => {
    if (err) { console.warn('Failed to add file'); console.error(err); return; }
    const file = findFile(path);
    if (file !== undefined) { console.warn('Adding an already existing file', path); return; }
    state.files.push({
      path: path,
      enabled: true,
      lastModified: stats.mtime,
      readUntil: 0
    });
  }));
};

const updateFile = action('updateFile', (path, patch) => {
  const file = findFile(path);
  if (file === undefined) { console.warn('Updating unexisting file', path, patch); return; }
  Object.assign(file, patch);
});

const removeFile = action('removeFile', path => {
  const file = findFile(path);
  if (file === undefined) { console.warn('Removing unexisting file', path); return; }
  state.logs = state.logs.filter(matchPath(path));
  state.files = state.files.filter(f => f.path !== path);
});

const resetFile = action('resetFile', path => {
  const file = findFile(path);
  if (file === undefined) { console.warn('Reseting unexisting file', path); return; }
  state.logs = state.logs.filter(matchPath(path));
  file.readUntil = 0;
  file.lastModified = new Date();
  // TODO : clear file
});

const updateFilters = action('updateFilters', (patch) => {
  state.filters = Object.assign({}, state.filters, patch);
});

const addLogger = action('addLogger', (newLogger) => {
  const logger = findLogger(newLogger.name);
  if (logger !== undefined) { console.warn('Adding an already existing logger', newLogger); return; }
  state.loggers.push(newLogger);
});

const updateLogger = action('updateLogger', (name, patch) => {
  const logger = findLogger(name);
  if (logger === undefined) { console.warn('Updating unexisting logger', name, patch); return; }
  Object.assign(logger, patch);
});

const removeLogger = action('removeLogger', (name) => {
  const logger = findLogger(name);
  if (logger === undefined) { console.warn('Removing unexisting logger', name); return; }
  state.loggers = state.loggers.filter(l => l.name !== name);
});

const updateUI = action('updateUI', (patch) => {
  state.ui = Object.assign(state.ui, patch);
});

module.exports = {
  state,
  logs,
  findFile,
  findLogger,
  addLogs,
  addFile,
  updateFile,
  updateFilters,
  addLogger,
  updateLogger,
  removeLogger,
  updateUI
};
