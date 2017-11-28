var _pauldijou$watch_logs$Native_Electron = function () {
  const { dialog } = require('electron').remote;
  const scheduler = _elm_lang$core$Native_Scheduler;
  const fromArray = _elm_lang$core$Native_List.fromArray;

  function showOpenDialog() {
    return scheduler.nativeBinding(callback => {
      dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
      }, (filenames) => {
        callback(scheduler.succeed(fromArray(filenames || [])))
      });
    });
  }

  return {
    showOpenDialog: showOpenDialog
  }
}()
