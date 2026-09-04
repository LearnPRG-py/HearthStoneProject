const MODEL_URL = "model.json";

let firstLetterFrames = 5;
let doubleLetterFrames = 60;

const CLASS_NAMES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "del",
  "nothing",
  "space",
];

const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const ctx = canvasEl.getContext("2d");
const outputEl = document.getElementById("output");
const transcriptEl = document.getElementById("transcript");

let model = null;
let labelBuffer = [];
let lastSpoken = null;

async function loadModel() {
  model = model = await tf.loadGraphModel(MODEL_URL);
  console.log("Model loaded.");
  console.log("Model input shape:", model.inputs[0].shape);
}

function normaliseLandmarks(landmarks) {
  let pts = landmarks.map((p) => [p.x, p.y, p.z]);
  const ref = pts[0];
  pts = pts.map((p) => [p[0] - ref[0], p[1] - ref[1], p[2] - ref[2]]);
  pts = pts.slice(1);

  const norms = pts.map((p) => Math.hypot(p[0], p[1], p[2]));
  const scale = Math.max(...norms) + 1e-6;

  pts = pts.map((p) => [p[0] / scale, p[1] / scale, p[2] / scale]);
  return pts;
}

async function predict(pts) {
  if (!model) return null;

  return tf.tidy(() => {
    const input = tf.tensor([pts], [1, 20, 3], "float32");

    const preds = model.predict(input);
    const arr = preds.dataSync();
    const idx = arr.indexOf(Math.max(...arr));

    return {
      label: CLASS_NAMES[idx],
      confidence: arr[idx],
    };
  });
}

function detectionIndices() {
  const double = Math.max(doubleLetterFrames, firstLetterFrames + 1);
  return {
    singleLowerIdx: double - firstLetterFrames,
    doubleIdx: double,
    upperIdx: double + 1,
  };
}

function processLabel(label) {
  const { singleLowerIdx, doubleIdx, upperIdx } = detectionIndices();
  labelBuffer.push(label);
  if (labelBuffer.length > upperIdx) labelBuffer.shift();
  if (labelBuffer.length < upperIdx) return;

  const tailUnique = new Set(labelBuffer.slice(singleLowerIdx)).size === 1;
  const fullUnique = new Set(labelBuffer.slice(1)).size === 1;
  const detectedLabel = labelBuffer[doubleIdx];

  if (
    tailUnique &&
    labelBuffer[singleLowerIdx] !== labelBuffer[singleLowerIdx - 1]
  ) {
    if (lastSpoken !== detectedLabel) {
      emitLetter(detectedLabel);
      lastSpoken = detectedLabel;
    }
  } else if (fullUnique && labelBuffer[1] !== labelBuffer[0]) {
    emitLetter(detectedLabel);
    lastSpoken = detectedLabel;
  }
}

function speakTranscript() {
  const message = new SpeechSynthesisUtterance(transcriptEl.textContent);
  window.speechSynthesis.speak(message);
}

function emitLetter(label) {
  if (label === "del") {
    transcriptEl.textContent = transcriptEl.textContent.slice(0, -1);
  } else if (label === "space") {
    transcriptEl.textContent += " ";
  } else if (label !== "nothing") {
    transcriptEl.textContent += label;
  }
  console.log("Detected:", label);
}

const hands = new Hands({
  locateFile: (f) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.5,
});

hands.onResults(async (results) => {
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  if (results.multiHandLandmarks?.length) {
    const landmarks = results.multiHandLandmarks[0];

    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
      color: "#00f",
      lineWidth: 1,
    });
    drawLandmarks(ctx, landmarks, {
      color: "#f00",
      radius: 3,
    });

    const pts = normaliseLandmarks(landmarks);
    const result = await predict(pts);

    if (result) {
      outputEl.textContent = `${result.label} (${(result.confidence * 100).toFixed(1)}%)`;

      processLabel(result.label);
    }
  } else {
    outputEl.textContent = "—";
  }
});

const firstLetterFramesInput = document.getElementById("firstLetterFrames");
const firstLetterFramesVal = document.getElementById("firstLetterFramesVal");
const doubleLetterFramesInput = document.getElementById("doubleLetterFrames");
const doubleLetterFramesVal = document.getElementById("doubleLetterFramesVal");
const clearBtn = document.getElementById("clear");

function syncParams() {
  firstLetterFrames = Number(firstLetterFramesInput.value);
  doubleLetterFrames = Number(doubleLetterFramesInput.value);
  firstLetterFramesVal.textContent = firstLetterFrames;
  doubleLetterFramesVal.textContent = doubleLetterFrames;
  labelBuffer = [];
  lastSpoken = null;
}

firstLetterFramesInput.addEventListener("input", syncParams);
doubleLetterFramesInput.addEventListener("input", syncParams);
syncParams();

clearBtn.addEventListener("click", () => {
  transcriptEl.textContent = "";
  labelBuffer = [];
  lastSpoken = null;
});

let isProcessing = false;

async function init() {
  await loadModel();

  new Camera(videoEl, {
    onFrame: async () => {
      if (isProcessing) return;
      isProcessing = true;

      try {
        await hands.send({ image: videoEl });
      } catch (err) {
        console.error("Hands error:", err);
      }

      isProcessing = false;
    },
    width: 640,
    height: 480,
  }).start();
}

init();
