const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const os = require("os");

const {
  runCreatorVerification
} = require("../verification/creatorVerify.js");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

ipcMain.on(
  "VERIFY_CREATOR_START",
  async (event, { videoPath, creatorKeyPath }) => {
    try {
      const result = await runCreatorVerification(
        videoPath,
        creatorKeyPath,
        (progress) => {
          event.sender.send(
            "VERIFY_CREATOR_PROGRESS",
            progress
          );
        }
      );

      event.sender.send(
        "VERIFY_CREATOR_RESULT",
        result
      );
    } catch (err) {
      event.sender.send(
        "VERIFY_CREATOR_ERROR",
        { message: err.message }
      );
    }
  }
);

// Handle in-memory uploads (ArrayBuffer / Buffer) from renderer
ipcMain.on(
  "VERIFY_CREATOR_START_BUFFER",
  async (event, { fileName, buffer, creatorKeyPath }) => {
    const tmpName = `stereoforge-${Date.now()}-${(fileName || 'upload').replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const tmpPath = path.join(os.tmpdir(), tmpName);

    try {
      // Convert ArrayBuffer -> Buffer if needed
      const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      await fsp.writeFile(tmpPath, nodeBuf);

      const result = await runCreatorVerification(
        tmpPath,
        creatorKeyPath,
        (progress) => {
          event.sender.send(
            "VERIFY_CREATOR_PROGRESS",
            progress
          );
        }
      );

      event.sender.send(
        "VERIFY_CREATOR_RESULT",
        result
      );
    } catch (err) {
      event.sender.send(
        "VERIFY_CREATOR_ERROR",
        { message: err.message }
      );
    } finally {
      // best-effort cleanup
      try { await fsp.unlink(tmpPath); } catch (e) { /* ignore */ }
    }
  }
);

app.whenReady().then(createWindow);