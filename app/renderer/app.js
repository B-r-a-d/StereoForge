const canvas = document.getElementById("preview");
const offscreen = canvas.transferControlToOffscreen();

const output = document.getElementById("output");
const videoInput = document.getElementById("videoInput");
const verifyBtn = document.getElementById("verifyBtn");

verifyBtn.onclick = () => {
  if (!videoInput?.files?.length) {
    output.textContent = "No video selected";
    return;
  }

  const file = videoInput.files[0];

  // Size check (example: 200 MB)
  const MAX_BYTES = 200 * 1024 * 1024;
  if (file.size && file.size > MAX_BYTES) {
    output.textContent = `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max ${MAX_BYTES / 1024 / 1024}MB.`;
    return;
  }

  // Type check (prefer MIME, fallback to extension)
  const allowedMime = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedExt = ['mp4', 'webm', 'mov', 'mkv'];

  if (file.type) {
    if (!allowedMime.includes(file.type) && !file.type.startsWith('video/')) {
      output.textContent = `Unsupported file type: ${file.type}`;
      return;
    }
  } else {
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
    if (!allowedExt.includes(ext)) {
      output.textContent = `Unsupported file extension: .${ext}`;
      return;
    }
  }

  // Disable button to prevent duplicate submissions
  verifyBtn.disabled = true;

  // Prefer using the OS file path (available in Electron). Fallback to reading file into memory.
  const videoPath = file.path || null;
  if (!videoPath) {
    output.textContent = "Local file path unavailable — using in-memory fallback (may be slow).";

    const reader = new FileReader();
    reader.onerror = (err) => {
      output.textContent = `Error reading file: ${err?.message || err}`;
      verifyBtn.disabled = false;
    };
    reader.onload = () => {
      const arrayBuffer = reader.result;
      try {
        window.stereoforge.verifyCreator({
          fileName: file.name,
          buffer: arrayBuffer
        });
        output.textContent = "Verifying (from memory)...";
      } catch (err) {
        output.textContent = `Error starting verification: ${err?.message || err}`;
        verifyBtn.disabled = false;
      }
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  // Normal Electron path
  try {
    window.stereoforge.verifyCreator({ videoPath });
    output.textContent = "Verifying...";
  } catch (err) {
    output.textContent = `Error starting verification: ${err?.message || err}`;
    verifyBtn.disabled = false;
  }
};

window.stereoforge.onVerifyProgress((p) => {
  output.textContent =
    `Progress: ${p.stage} (${p.frame}/${p.total})`;
});

window.stereoforge.onVerifyResult((r) => {
  output.textContent =
    `Result: ${JSON.stringify(r, null, 2)}`;
  // Re-enable the verify button when finished
  verifyBtn.disabled = false;
});

window.stereoforge.onVerifyError((e) => {
  output.textContent =
    `Error: ${e.message}`;
  verifyBtn.disabled = false;
});

let quality = { scale: 1.0 };

function adapt(ms) {
  if (ms > 16) quality.scale *= 0.95;
  if (ms < 8) quality.scale *= 1.05;
}

const worker = new Worker("worker.js", { type: "module" });

worker.onmessage = e => {
  if (e.data.gpuMs) {
    localStorage.setItem("gpuProfile", JSON.stringify(e.data));
  }
};

worker.postMessage({
  type: "init",
  canvas: offscreen,
  width: canvas.width,
  height: canvas.height
}, [offscreen]);