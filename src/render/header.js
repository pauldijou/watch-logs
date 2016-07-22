const h = require('snabbdom/h');
const { dialog } = require('electron').remote;
const { state, updateFilters, updateUI } = require('../state');
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
    h('div', {}, [
      h('button.settings', { props: { type: 'button' }, on: { click: openSettings } }, [ 'Settings' ]),
      h('button.load', { props : { type: 'button' }, on: { click: showLoadFiles } }, [ 'Load' ]),
      h('h1', {}, 'Watch Logs'),
    ]),
    h('div.message', {}, [
      h('input', { props: { type: 'text', value: state.filters.message || '' }, on: { input: updateMessage } }, [])
    ]),
    h('div.filters', {}, [
      h('div.filter.from', {}, [
        h('input', { props: { type: 'time', step: '1' }, on: { input: updateFrom } }, [])
      ]),
      h('div.filter.to', {}, 'To'),
      h('div.filter.files', {}, 'Files'),
      h('div.filter.tags', {}, 'Tags'),
      h('div.filter.levels', {}, [
        h('span', {}, 'Levels'),
        h('div.levels-dropdown', {}, levels.map(lvl =>
          h('label', {}, [
            h('input', {
              props: { type: 'checkbox', checked: (state.filters.levels || []).indexOf(lvl) >= 0 },
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
