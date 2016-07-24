// const { app } = require('electron').remote;
const { state, logs, updateUI } = require('./src/state');
const { init: initWatcher } = require('./src/watcher');
const { init: initSpy } = require('./src/spy');

initSpy();
initWatcher();

require('./src/render');

// app.on('browser-window-blur', () => {
//   updateUI({ lastFocus: new Date() });
// });
