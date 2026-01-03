let gl;
let ext;

self.onmessage = e => {
  if (e.data.type === "init") {
    const { canvas, width, height } = e.data;
    gl = canvas.getContext("webgl2");
    if (!gl) {
      postMessage({ error: 'Unable to create WebGL2 context' });
      return;
    }

    // Obtain extensions after the context exists
    ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");

    gl.viewport(0, 0, width, height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
};