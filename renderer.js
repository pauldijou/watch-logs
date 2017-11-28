const Elm = require('./app.js')

function load(key) {
  let value = localStorage.getItem(key)
  if (value !== undefined) {
    try {
      value = JSON.parse(value)
    } catch (e) {
      value = null
    }
  }
  if (value === undefined) {
    value = null;
  }
  return value
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const app = Elm.App.fullscreen({
  files: load('files'),
  filters: load('filters'),
  configuration: load('configuration'),
  loggers: load('loggers'),
  levels: load('levels'),
})

app.ports.save.subscribe(flags => {
  Object.keys(flags).forEach(key => {
    save(key, flags[key])
  })
})
