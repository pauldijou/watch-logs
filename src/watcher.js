const fs = require('fs');
const chokidar = require('chokidar');
const { when } = require('mobx');
const { state, addFile, updateFile, removeFile, findFile, addLogs } = require('./state');
const log = require('./log');

const watcher = chokidar.watch([], {});

watcher.on('add', (path, stats) => {
  const file = findFile(path);
  // Necessary for init phase where some files are already in the state
  // but need to be added to the watcher
  if (file === undefined) {
    addFile(path);
  }
  when('waitFileAdded', () => findFile(path) !== undefined, () => {
    parseFile(path, stats, 0);
  });
});

watcher.on('change', (path, stats) => {
  const file = findFile(path);
  if (file === undefined) { console.warn('Monitoring a removed file', path); return; }
  parseFile(path, stats, file.readUntil);
});

watcher.on('unlink', path => {
  unwatch([path]);
});

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
            .split('\n') // split lines
            .map(s => s.trim()) // remove whitespaces
            .filter(s => !!s) // remove empty lines
            .map(JSON.parse); // make the magic happen
          resolve(logs);
        } catch (e) {
          reject(e);
        }
      });
    })
  });
}

function parseFile(path, stats, from) {
  return parseLogs(path, from, stats.size).then(logs => {
    updateFile(path, { readUntil: stats.size, lastModified: stats.mtime });
    addLogs(path, logs);
  }).catch(e => {
    updateFile(path, { readUntil: stats.size, lastModified: stats.mtime });
    throw e;
  });
}

function init() {
  watch(state.files.map(f => f.path));
}

function watch(paths = []) {
  watcher.add(paths);
}

function unwatch(paths = []) {
  paths.forEach(removeFile);
  watcher.unwatch(paths);
}

module.exports = {
  init,
  watch,
  unwatch
};
