const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stereoforge", {
  verifyCreator: (payload) => {
    // If a raw buffer is provided (in-memory fallback), use a dedicated channel
    if (payload && payload.buffer) {
      ipcRenderer.send("VERIFY_CREATOR_START_BUFFER", payload);
      return;
    }

    ipcRenderer.send("VERIFY_CREATOR_START", payload);
  },

  onVerifyProgress: (callback) =>
    ipcRenderer.on(
      "VERIFY_CREATOR_PROGRESS",
      (_, data) => callback(data)
    ),

  onVerifyResult: (callback) =>
    ipcRenderer.on(
      "VERIFY_CREATOR_RESULT",
      (_, result) => callback(result)
    ),

  onVerifyError: (callback) =>
    ipcRenderer.on(
      "VERIFY_CREATOR_ERROR",
      (_, err) => callback(err)
    )
});
