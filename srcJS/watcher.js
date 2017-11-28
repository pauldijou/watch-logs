const fs = require('fs');
const chokidar = require('chokidar');
const { when } = require('mobx');
const { state, addFile, updateFile, removeFile, findFile, addLogs } = require('./state');

// 1G
const MAX_SIZE = 1000000000;

const watcher = chokidar.watch([], {
  awaitWriteFinish: {
    stabilityThreshold: 500 // TODO : should be configurable
  }
});

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

    if (to - from > MAX_SIZE) {
      return reject(new Error('File is too big, this is not for prod logs, it will consume all your memory'))
    }

    // Stream implementation. Slower but needed for big files if necessary at some point
    // (still not fully optimized at all)

    // const logs = [];
    // let data = '';
    // fs.createReadStream(path, { encoding: 'utf8', start: from, end: to - from })
    //   .on('data', d => {
    //     // console.log('data', logs.length)
    //     const lines = (data + d).split('\n'); // split lines
    //     data = lines.pop();
    //
    //      lines.map(s => s.trim()) // remove whitespaces
    //       .filter(s => !!s) // remove empty lines
    //       .forEach((line, idx) => {
    //         try {
    //           logs.push(JSON.parse(line))
    //         } catch (e) {
    //           console.error('Failed to read log', line, e);
    //         }
    //       }); // make the magic happen
    //   }).on('close', () => {
    //     resolve(logs);
    //   }).on('end', () => {
    //     resolve(logs);
    //   }).on('error', err => {
    //     reject(err);
    //   });

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
