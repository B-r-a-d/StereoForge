const { autoUpdater } = require("electron-updater");

function initUpdater(win) {
  autoUpdater.checkForUpdatesAndNotify();
}

module.exports = { initUpdater };