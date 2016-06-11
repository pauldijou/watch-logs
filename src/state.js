function init(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (e) {
    localStorage.removeItem(key);
    return defaultValue;
  }
}

let state = {
  logs: [],
  files: {},
  settings: Object.assign({ files: [] }, init('settings', {})),
  filters: Object.assign({
    message: '',
    levels: [ 'debug', 'info', 'warn', 'error' ]
  }, init('filters', {})),
  ui: {
    settings: false,
    openedLogs: []
  }
};

console.log('INIT STATE', state);

const listeners = [];

function get() {
  return state;
}

function onUpdate(listener) {
  listeners.push(listener);
}

function update(newState) {
  state = Object.assign({}, state, newState);
  console.log('UPDATED STATE', state);
  listeners.forEach(l => l(state));
}

function updateFirstLevel(key, value) {
  update({ [key]: Object.assign({}, state[key], value) });
}

function updateSettings(settings) {
  updateFirstLevel('settings', settings);
  localStorage.setItem('settings', JSON.stringify(state.settings));
}

function updateFilters(filters) {
  updateFirstLevel('filters', filters);
  localStorage.setItem('filters', JSON.stringify(state.filters));
}

function updateUi(ui) {
  updateFirstLevel('ui', ui);
}

module.exports = {
  get,
  onUpdate,
  update,
  updateSettings,
  updateFilters,
  updateUi
};
