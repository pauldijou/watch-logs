const h = require('snabbdom/h');
const { state, logs } = require('../state');
const { getClock, getStyle, getFileColor, isOpen, toggle } = require('../log');
const { render: renderPayload } = require('../payload');

function handleToggle(log) {
  return function doHandleToggle() {
    toggle(log);
  }
}

function renderLog(log) {
  const cells = [
    h('td.level', {}, getClock(log)),
    h('td.message', {}, [
      h('div.content', { on: { click: handleToggle(log) } }, log.message),
      h('div.payload', { style: { display: isOpen(log) ? 'block' : 'none' } }, renderPayload(log.payload))
    ]),
  ];

  if (state.files.length > 1) {
    cells.push(
      h('td.file', {}, [
        h('div', { style: { backgroundColor: getFileColor(log) } }, [])
      ])
    );
  }

  return h('tr.log.' + (log.level || 'info'), { style: getStyle(log) }, cells);
}

function render() {
  return h('table#logs', {}, logs.get().map(renderLog));
}

module.exports = {
  render
};
