const h = require('snabbdom/h');
const { action } = require('mobx');
const private = Symbol('private');

function getType(item) {
  return Object.prototype.toString.call(item).slice(8, -1);
}

function init(payload) {
  switch (getType(payload)) {
    case 'Object':
      payload[private] = { collapsed: true, expendable: Object.keys(payload).length > 0, keys: Object.keys(payload) };
      payload[private].keys.forEach(key => init(payload[key]));
      break;
    case 'Array':
      payload[private] = { collapsed: true, expendable: payload.length > 0 };
      payload.forEach(init);
      break
  }
  return payload;
}

const renderEvent = new Event('render');

const doToggle = action('togglePayload', (item) => {
  item[private].collapsed = !item[private].collapsed;
  document.dispatchEvent(renderEvent);
});

const toggle = (item) => () => doToggle(item);

function renderObjectKeys(obj) {
  return obj[private].keys.map(key => h('li', {}, [ renderAny(obj[key], key) ]))
}

function renderObject(obj, key) {
  const children = obj[private].collapsed ? [] : renderObjectKeys(obj);
  return h('ul', {}, [ h('li', { on: { click: toggle(obj) } }, key + ': {} ' + obj[private].keys.length + ' key' + (obj[private].keys.length > 1 ? 's' : '')) ].concat(children));
}

function renderArrayChildren(arr) {
  return arr.map((value, idx) => h('li', {}, [ renderAny(value, idx) ]));
}

function renderArray(arr, key) {
  const children = arr[private].collapsed ? [] : renderArrayChildren(arr);
  return h('ul', {}, [ h('li', { on: { click: toggle(arr) } }, key + ': [] ' + arr.length + ' item' + (arr.length > 1 ? 's' : '')) ].concat(children));
}

function renderDate(date, key) {
  return h('span', {}, key + ': ' + date);
}

function renderString(str, key) {
  return h('span', {}, key + ': "' + str + '"');
}

function renderNumber(num, key) {
  return h('span', {}, key + ': ' + num);
}

function renderBoolean(bool, key) {
  return h('span', {}, key + ': ' + bool);
}


function renderAny(value, key = 'payload') {
  switch (getType(value)) {
    case 'Object': return renderObject(value, key); break;
    case 'Array': return renderArray(value, key); break;
    case 'Date': return renderDate(value, key); break;
    case 'Number': return renderNumber(value, key); break;
    case 'String': return renderString(value, key); break;
    case 'Boolean': return renderBoolean(value, key); break;
    default: return h('span', {}, []);
  }
}

function render(payload) {
  switch (getType(payload)) {
    case 'Object': return [ h('ul', {}, renderObjectKeys(payload)) ]; break;
    case 'Array': return [ h('ul', {}, renderArrayChildren(payload)) ]; break;
    case 'Date': return [ h('ul', {}, [ renderDate(payload, 'payload') ] ) ]; break;
    case 'Number': return [ h('ul', {}, [ renderNumber(payload, 'payload') ] ) ]; break;
    case 'String': return [ h('ul', {}, [ renderString(payload, 'payload') ] ) ]; break;
    case 'Boolean': return [ h('ul', {}, [ renderBoolean(payload, 'payload') ] ) ]; break;
    default: return [];
  };
}

module.exports = {
  init: init,
  render: render,
};
