const snabbdom = require('snabbdom');
const patch = snabbdom.init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/style'),
  require('snabbdom/modules/eventlisteners'),
]);

const h = require('snabbdom/h');
const container = document.getElementById('view');

const { get: getState, onUpdate } = require('./state');
const { render: renderHeader } = require('./render/header');
const { render: renderLogs } = require('./render/logs');
const { render: renderSettings } = require('./render/settings');

let view = render(getState());
patch(container, view);

onUpdate(state => {
  const newView = render(state);
  patch(view, newView);
  view = newView;
});

function render(state) {
  return h('div#view', {}, [
    renderHeader(state),
    renderLogs(state),
    renderSettings(state)
  ]);
}
