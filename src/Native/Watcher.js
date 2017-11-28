var _pauldijou$watch_logs$Native_Watcher = function () {
  const fs = require('fs');
  const chokidar = require('chokidar');
  const scheduler = _elm_lang$core$Native_Scheduler;
  const toArray = _elm_lang$core$Native_List.toArray;

  // 1G
  const MAX_SIZE = 1000000000;

  const watcher = chokidar.watch([], {
    awaitWriteFinish: {
      stabilityThreshold: 500 // TODO : should be configurable
    }
  })

  function init({ callback, added, changed, unlinked }) {
    return scheduler.nativeBinding(cb => {
      watcher.on('add', (path, stats) => {
        console.log('add', path, stats, added);
        scheduler.rawSpawn(callback(A2(added, path, stats)))
      })

      watcher.on('change', (path, stats) => {
        console.log('change', path, stats, changed);
        scheduler.rawSpawn(callback(A2(changed, path, stats)))
      })

      watcher.on('unlink', path => {
        console.log('unlink', path, unlinked);
        scheduler.rawSpawn(callback(unlinked(path)))
      })

      cb(scheduler.succeed())
    })
  }

  function watch(paths) {
    console.log('watch', toArray(paths))
    return scheduler.nativeBinding(cb => {
      watcher.add(toArray(paths))
      cb(scheduler.succeed())
    })
  }

  function unwatch(paths) {
    return scheduler.nativeBinding(cb => {
      watcher.unwatch(toArray(paths))
      cb(scheduler.succeed())
    })
  }

  function read({ path, from, to }) {
    return scheduler.nativeBinding(callback => {
      if (to < from) {
        // WTF? The file is smaller?
        return callback(scheduler.fail('File must grow bigger and bigger'))
      }

      if (to - from > MAX_SIZE) {
        return callback(scheduler.fail('File is too big, this is not for prod logs, it will consume all your memory'))
      }

      fs.open(path, 'r', (err, fd) => {
        if (err) { return callback(scheduler.fail(err.toString())) }
        const buf = Buffer.alloc(to - from)

        fs.read(fd, buf, 0, to - from, from, (err2, bytesRead, buffer) => {
          if (err2) { return callback(scheduler.fail(err2.toString())) }
          callback(scheduler.succeed(buffer.toString('utf8')))
        })
      })
    })
  }

  return {
    init: init,
    watch: watch,
    unwatch: unwatch,
    read: read
  }
}()
