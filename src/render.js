const { autorun, reaction } = require('mobx');
const snabbdom = require('snabbdom');
const patch = snabbdom.init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/attributes'),
  require('snabbdom/modules/style'),
  require('snabbdom/modules/eventlisteners'),
]);

const h = require('snabbdom/h');
const container = document.getElementById('view');

const { state, logs } = require('./state');
const { render: renderHeader } = require('./render/header');
const { render: renderLogs } = require('./render/logs');
const { render: renderSettings } = require('./render/settings');

let view = render();
patch(container, view);

autorun('render', () => {
  view = patch(view, render());
});

document.addEventListener('render', function () {
  view = patch(view, render());
}, false);

function render() {
  console.log('RENDER', state, JSON.parse(JSON.stringify(state)));
  return h('div#view', {}, [
    renderHeader(),
    renderLogs(),
    renderSettings()
  ]);
}
