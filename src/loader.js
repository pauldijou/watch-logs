const fs = require('fs');
const chokidar = require('chokidar');
const { get: getState, update: updateState } = require('./state');
const log = require('./log');

const watcher = chokidar.watch([], {});

watcher.on('add', (path, stats) => {
  updateFile(path, stats, 0);
});

watcher.on('change', (path, stats) => {
  if (!getFiles()[path]) { return; }
  const lastStats = getFiles()[path].stats;
  updateFile(path, stats, lastStats.size);
});

watcher.on('unlink', path => {
  console.log('UNLINK', path);
  unloadFiles([path]);
});

function getFiles() {
  return getState().files || {};
}

function parseLogs(path, from, to) {
  return new Promise((resolve, reject) => {
    if (to < from) {
      // WTF? The file is smaller?
      return reject(new Error('File must grow bigger and bigger'));
    }

    fs.open(path, 'r', (err, fd) => {
      const buf = Buffer.alloc(to - from);
      if (err) { return reject(err); }
      fs.read(fd, buf, 0, to - from, from, (err2, bytesRead, buffer) => {
        if (err2) { return reject(err2); }
        try {
          const data = buffer.toString('utf8');
          const logs = data
            .split('\n')
            .map(s => s.trim())
            .filter(s => !!s)
            .map(JSON.parse)
            .map(log.normalize(path));
          resolve(logs);
        } catch (e) {
          reject(e);
        }
      });
    })
  });
}

function stats(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) { reject(err); }
      else { resolve(stats); }
    });
  });
}

function updateFile(path, stats, from) {
  return parseLogs(path, from, stats.size).then(logs => {
    return updateState({
      logs: logs.reverse().concat(getState().logs),
      files: Object.assign({}, getState().files, { [path]: { path, stats } })
    });
  }).catch(e => {
    console.error(e);
    return updateState({
      files: Object.assign({}, getState().files, { [path]: { path, stats } })
    });
  });
}

function loadFiles(paths = []) {
  watcher.add(paths);
}

function unloadFiles(paths = []) {
  const files = getState().files;
  const newFiles = Object.keys(getState().files)
    .filter(f => paths.indexOf(f) === -1)
    .reduce((acc, f) => {
      acc[k] = files[k];
    }, {})

  updateState({
    files: newFiles,
    logs: getState().logs.filter(l => !log.matchPaths(paths)(l))
  });
  watcher.unwatch(paths);
}

module.exports = {
  loadFiles,
  unloadFiles
};
