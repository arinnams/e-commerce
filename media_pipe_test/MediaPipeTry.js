// Простая интеграция MediaPipe Pose в статический сайт.
// Требует: pose.js и camera_utils.js подключены через CDN (в index.html)

const videoElement = document.getElementById("input_video");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const dressImg = document.getElementById("dressOverlay");

let camera = null;
let pose = null;
let lastBox = null;

function updateStatus(s) { statusEl.innerText = "Status: " + s; }

// Инициализация MediaPipe Pose
function createPose() {
  pose = new Pose({
    locateFile: (file) => {
      // используем CDN — надежно для простого теста
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  pose.onResults(onResults);
}

function onResults(results) {
  if (!videoElement.videoWidth) return;

  // Подготовка canvas к размеру
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  // рисуем кадр видео
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // рисуем ключевые точки (для отладки)
  if (results.poseLandmarks) {
    canvasCtx.fillStyle = "rgba(0,255,0,0.9)";
    results.poseLandmarks.forEach(pt => {
      const x = pt.x * canvasElement.width;
      const y = pt.y * canvasElement.height;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 3, 0, 2 * Math.PI);
      canvasCtx.fill();
    });

    // Берём плечи и бёдра для вычисления области корпуса
    const L_SH = results.poseLandmarks[11];
    const R_SH = results.poseLandmarks[12];
    const L_H = results.poseLandmarks[23];
    const R_H = results.poseLandmarks[24];

    if (L_SH && R_SH && L_H && R_H) {
      const sx = Math.min(L_SH.x, R_SH.x);
      const ex = Math.max(L_SH.x, R_SH.x);
      const sy = Math.min(L_SH.y, R_SH.y);
      const ey = Math.max(L_H.y, R_H.y);

      const x = sx * canvasElement.width;
      const y = sy * canvasElement.height;
      const w = (ex - sx) * canvasElement.width;
      const h = (ey - sy) * canvasElement.height;

      // угол наклона плеч
      const dx = (R_SH.x - L_SH.x) * canvasElement.width;
      const dy = (R_SH.y - L_SH.y) * canvasElement.height;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      lastBox = { x, y, w, h, angle, cx: x + w / 2, cy: y + h / 2 };

      // Debug: рамка
      canvasCtx.save();
      canvasCtx.translate(lastBox.cx, lastBox.cy);
      canvasCtx.rotate((lastBox.angle * Math.PI) / 180);
      canvasCtx.strokeStyle = "rgba(255,0,0,0.6)";
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(-w/2, -h/2, w, h);
      canvasCtx.restore();

      // Отображаем overlay (картинка платья) и позиционируем её
      dressImg.style.display = "block";
      // позиционируем по центру box, ширина = w * factor
      const widthPx = w * 1.05;
      dressImg.style.width = `${widthPx}px`;
      dressImg.style.left = `${lastBox.cx}px`;
      dressImg.style.top = `${lastBox.cy}px`;
      dressImg.style.transform = `translate(-50%,-50%) rotate(${lastBox.angle}deg)`;
    } else {
      // если поза не найдена — скрываем overlay
      dressImg.style.display = "none";
    }
  } else {
    dressImg.style.display = "none";
  }

  canvasCtx.restore();
}

// Запуск камеры
function startCamera() {
  if (!pose) createPose();

  camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });
    },
    width: 1280,
    height: 720
  });

  camera.start();
  updateStatus("running");
}

// Остановка камеры
function stopCamera() {
  if (camera) {
    camera.stop();
    camera = null;
  }
  updateStatus("stopped");
  dressImg.style.display = "none";
}

// Кнопки
startBtn.addEventListener("click", () => {
  startCamera();
});
stopBtn.addEventListener("click", () => {
  stopCamera();
});

// По умолчанию попробуем автоматически стартовать (если разрешение уже есть)
window.addEventListener("load", () => {
  createPose();
  updateStatus("ready");
});
