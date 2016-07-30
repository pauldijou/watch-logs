const h = require('snabbdom/h');
const { dialog } = require('electron').remote;
const { state, updateFile, updateLogger, updateFilters, updateUI } = require('../state');
const { watch } = require('../watcher');

const levels = [ 'debug', 'info', 'warn', 'error' ];

function openSettings() {
  updateUI({ settings: true });
}

function closeSettings() {
  updateUI({ settings: false });
}

function showLoadFiles() {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections']
  }, (filenames) => {
    if (!filenames) { return; }
    watch(filenames);
  });
}

function updateMessage(event) {
  updateFilters({ message: event.target.value });
}

function updateFrom(from) {
  console.log('FROM', from.target.value);
}

function updateTo(to) {
  console.log('TO', to);
}

function toggleFile(file) {
  return function doToggleFile(event) {
    updateFile(file.path, { enabled: event.target.checked });
  }
}

function toggleLogger(logger) {
  return function doToggleLogger(event) {
    updateLogger(logger.name, { enabled: event.target.checked });
  }
}

function updateLevel(level) {
  return function doUpdateLevel(event) {
    if (event.target.checked) {
      updateFilters({ levels: (state.filters.levels || []).concat([level]) });
    } else {
      updateFilters({ levels: (state.filters.levels || []).filter(l => l !== level) });
    }
  }
}

function render() {
  return h('div#header', {}, [
    h('h1', {}, 'Watch Logs'),
    h('div.actions', {}, [
      h('button.action.load', { attrs : { type: 'button' }, on: { click: showLoadFiles } }, [ 'L' ]),
      h('button.action.settings', { attrs: { type: 'button' }, on: { click: openSettings } }, [ 'S' ]),
      h('div.clear.dropdown', {}, [
        h('div.action', {}, 'C'),
        h('div.dropdown-content.is-right', {}, state.files.map(f => {
          return h('div', {}, f.name);
        })),
      ]),
    ]),
    h('div.message', {}, [
      h('input', { attrs: { type: 'text', value: state.filters.message || '' }, on: { input: updateMessage } }, [])
    ]),
    h('div.filters', {}, [
      h('div.filter.from', {}, [
        h('input', { attrs: { type: 'time', step: '1' }, on: { input: updateFrom } }, [])
      ]),
      h('div.filter.to', {}, 'To'),
      h('div.filter.files.dropdown', {}, [
        h('span', {}, 'Files'),
        h('div.files.dropdown-content', {}, state.files.map(f =>
          h('label', {}, [
            h('input', {
              attrs: { type: 'checkbox', checked: f.enabled },
              on: { change: toggleFile(f) }
            }, []),
            h('span', { attrs: { title: f.path } }, f.name)
          ])
        ))
      ]),
      h('div.filter.loggers.dropdown', {}, [
        h('span', {}, 'Loggers'),
        h('div.loggers.dropdown-content', {}, state.loggers.map(l =>
          h('label', {}, [
            h('input', {
              attrs: { type: 'checkbox', checked: l.enabled },
              on: { change: toggleLogger(l) }
            }, []),
            h('span', {}, l.name)
          ])
        ))
      ]),
      h('div.filter.levels.dropdown', {}, [
        h('span', {}, 'Levels'),
        h('div.levels.dropdown-content', {}, levels.map(lvl =>
          h('label', {}, [
            h('input', {
              attrs: { type: 'checkbox', checked: (state.filters.levels || []).indexOf(lvl) >= 0 },
              on: { change: updateLevel(lvl) }
            }, []),
            h('span', {}, lvl)
          ])
        ))
      ]),
    ])
  ]);
}

module.exports = {
  render
};
