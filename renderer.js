const { state, logs, initFiles } = require('./src/state');
const { init: initWatcher } = require('./src/watcher');
const { init: initSpy } = require('./src/spy');

initSpy();
initWatcher(initFiles);

require('./src/render');
