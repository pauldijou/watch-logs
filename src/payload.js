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

function close(payload) {
  switch (getType(payload)) {
    case 'Object':
      payload[private].collapsed = true;
      payload[private].keys.forEach(key => close(payload[key]));
      break;
    case 'Array':
      payload[private].collapsed = true;
      payload.forEach(close);
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

function renderKey(key, collapsed) {
  return h('span.payload-key', { class: {
    'click-me': (collapsed !== undefined),
    'collapsed': (collapsed === true),
    'expanded': (collapsed === false),
  } }, key + ': ');
}

function renderFullKey(key, type, type2, size, collapsed) {
  return renderKey(key + ': ' + type + ' ' + size + ' ' + type2 + (size > 1 ? 's' : ''), collapsed);
}

function renderObjectKeys(obj) {
  return obj[private].keys.map(key => h('li', {}, renderAny(obj[key], key)))
}

function renderObject(obj, key) {
  const children = obj[private].collapsed ? [] : renderObjectKeys(obj);
  return h('ul.payload-object', {}, [ h('li',{ on: { click: toggle(obj) } }, [ renderFullKey(key, '{}', 'key', obj[private].keys.length, obj[private].collapsed) ]) ].concat(children));
}

function renderArrayChildren(arr) {
  return arr.map((value, idx) => h('li', {}, renderAny(value, idx)));
}

function renderArray(arr, key) {
  const children = arr[private].collapsed ? [] : renderArrayChildren(arr);
  return h('ul.payload-array', {}, [ h('li', { on: { click: toggle(arr) } }, [ renderFullKey(key, '[]', 'item', arr.length, arr[private].collapsed) ]) ].concat(children));
}

function renderDate(date, key) {
  return [
    renderKey(key),
    h('span.payload-date', {}, '' + date),
  ];
}

function renderString(str, key) {
  return [
    renderKey(key),
    h('span.payload-string', {}, '"' + str + '"'),
  ];
}

function renderNumber(num, key) {
  return [
    renderKey(key),
    h('span.payload-number', {}, '' + num),
  ];
}

function renderBoolean(bool, key) {
  return [
    renderKey(key),
    h('span.payload-boolean', {}, '' + bool),
  ];
}

function renderUndefined(key) {
  return [
    renderKey(key),
    h('span.payload-undefined', {}, 'undefined'),
  ];
}

function renderNull(key) {
  return [
    renderKey(key),
    h('span.payload-null', {}, 'null'),
  ];
}

// Return array[dom]
function renderAny(value, key = 'payload') {
  switch (getType(value)) {
    case 'Object': return [renderObject(value, key)]; break;
    case 'Array': return [renderArray(value, key)]; break;
    case 'Date': return renderDate(value, key); break;
    case 'Number': return renderNumber(value, key); break;
    case 'String': return renderString(value, key); break;
    case 'Boolean': return renderBoolean(value, key); break;
    case 'Undefined': return renderUndefined( key); break;
    case 'Null': return renderNull(key); break;
    default: return h('span', {}, []);
  }
}

// Return array[dom]
function render(payload) {
  switch (getType(payload)) {
    case 'Object': return [ h('ul', {}, renderObjectKeys(payload)) ]; break;
    case 'Array': return [ h('ul', {}, renderArrayChildren(payload)) ]; break;
    case 'Date': return [ h('ul', {}, [ h('li', {}, renderDate(payload, 'payload')) ] ) ]; break;
    case 'Number': return [ h('ul', {}, [ h('li', {}, renderNumber(payload, 'payload')) ] ) ]; break;
    case 'String': return [ h('ul', {}, [ h('li', {}, renderString(payload, 'payload')) ] ) ]; break;
    case 'Boolean': return [ h('ul', {}, [ h('li', {}, renderBoolean(payload, 'payload')) ] ) ]; break;
    case 'Undefined': return [ h('ul', {}, [ h('li', {}, renderUndefined('payload')) ] ) ]; break;
    case 'Null': return [ h('ul', {}, [ h('li', {}, renderNull('payload')) ] ) ]; break;
    default: return [];
  };
}

module.exports = {
  init: init,
  close: close,
  render: render,
};
