// verification/creatorVerify.js

async function runCreatorVerification(
  videoPath,
  creatorKeyPath,
  onProgress
) {
  if (!videoPath) {
    throw new Error("No video file supplied");
  }

  // Fake progress for now
  const total = 60;
  for (let i = 1; i <= total; i++) {
    await new Promise(r => setTimeout(r, 30));
    onProgress({
      stage: "analyzing",
      frame: i,
      total
    });
  }

  // Temporary result
  if (creatorKeyPath) {
    return {
      status: "NO_MATCH"
    };
  }

  return {
    status: "NOT_PRESENT"
  };
}

module.exports = {
  runCreatorVerification
};