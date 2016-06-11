const { get: getState } = require('./src/state');
const { loadFiles } = require('./src/loader');

const initState = getState();
loadFiles(initState.settings.files);

require('./src/render');
