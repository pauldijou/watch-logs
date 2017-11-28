const h = require('snabbdom/h');
const { dialog } = require('electron').remote;
const { by, findDuration } = require('../utils');
const { state, updateFile, updateLogger, updateLevel, updateFilters, updateUI } = require('../state');
const { watch } = require('../watcher');

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

function updateFiltersMessage(event) {
  updateFilters({ message: event.target.value });
}

function updateFiltersLogger(event) {
  updateFilters({ logger: event.target.value });
}

function updateDuration(duration) {
  return function doUpdateDuration() {
    updateFilters({ duration: duration.key });
  }
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

const toggleLevel = level => event => {
  updateLevel(level.name, { enabled: !level.enabled });
};

function updateUser(event) {
  updateFilters({ user: event.target.value });
}

function render() {
  const duration = findDuration(state.filters.duration);

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
      h('input', { attrs: { type: 'text', placeholder: 'Message' }, props: { value: state.filters.message || '' }, on: { input: updateFiltersMessage } }, []),
      h('input', { attrs: { type: 'text', placeholder: 'Logger' }, props: { value: state.filters.logger || '' }, on: { input: updateFiltersLogger } }, []),
    ]),
    h('div.filters', {}, [
      h('div.filter.duration.dropdown', {}, [
        h('span', {}, duration.label),
        h('div.files.dropdown-content', {}, state.durations.map(d =>
          h('div.click-me', { on: { click: updateDuration(d) } }, d.label)
        ))
      ]),
      h('div.filter.files.dropdown', {}, [
        h('span', {}, 'Files'),
        h('div.files.dropdown-content', {}, state.files.sort(by('name')).map(f =>
          h('label', {}, [
            h('input', {
              attrs: { type: 'checkbox' },
              props: { checked: f.enabled },
              on: { change: toggleFile(f) }
            }, []),
            h('span', { attrs: { title: f.path } }, f.name)
          ])
        ))
      ]),
      h('div.filter.loggers.dropdown', {}, [
        h('span', {}, 'Loggers'),
        h('div.loggers.dropdown-content', {}, state.loggers.sort(by('name')).map(l =>
          h('label', {}, [
            h('input', {
              attrs: { type: 'checkbox' },
              props: { checked: l.enabled },
              on: { change: toggleLogger(l) }
            }, []),
            h('span', {}, l.name)
          ])
        ))
      ]),
      h('div.filter.levels', {}, state.levels.map(level =>
        h('div.level.click-me', {
          attrs: { title: level.name },
          class: { disabled: !level.enabled },
          style: { backgroundColor: level.color },
          on: { click: toggleLevel(level) }
        }, [])
      )),
      h('div.filter.user', {}, [
        h('input', {
          attrs: { type: 'text', placeholder: 'User' },
          props: { value: state.filters.user || '' },
          on: { input: updateUser }
        }, [])
      ])
    ])
  ]);
}

module.exports = {
  render
};
