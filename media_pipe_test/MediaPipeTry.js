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

function updateStatus(s) { 
    statusEl.innerText = "Status: " + s; 
    console.log("Status: " + s); // Выводим статус в консоль для отладки
}

// Инициализация MediaPipe Pose
function createPose() {
  pose = new Pose({
    locateFile: (file) => {
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

  // ... (Вся ваша логика onResults остается без изменений) ...

  // Подготовка canvas к размеру
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  // рисуем кадр видео
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  // Обязательно зеркалим изображение для реалистичного "зеркала"
  canvasCtx.scale(-1, 1);
  canvasCtx.drawImage(results.image, -canvasElement.width, 0, canvasElement.width, canvasElement.height);

  // рисуем ключевые точки (для отладки)
  if (results.poseLandmarks) {
    canvasCtx.fillStyle = "rgba(0,255,0,0.9)";
    results.poseLandmarks.forEach(pt => {
      // Учитываем, что canvas был зеркально отражен!
      const x = (1 - pt.x) * canvasElement.width; 
      const y = pt.y * canvasElement.height;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 3, 0, 2 * Math.PI);
      canvasCtx.fill();
    });
    
    // Возвращаем canvas в нормальное состояние, чтобы наложение работало корректно
    canvasCtx.restore(); 

    // Берём плечи и бёдра для вычисления области корпуса
    const L_SH = results.poseLandmarks[11];
    const R_SH = results.poseLandmarks[12];
    const L_H = results.poseLandmarks[23];
    const R_H = results.poseLandmarks[24];
    
    if (L_SH && R_SH && L_H && R_H) {
      // Используем исходные координаты (0..1)
      const sx = Math.min(L_SH.x, R_SH.x);
      const ex = Math.max(L_SH.x, R_SH.x);
      const sy = Math.min(L_SH.y, R_SH.y);
      const ey = Math.max(L_H.y, R_H.y);

      const w_norm = ex - sx;
      const h_norm = ey - sy;
        
        // Преобразуем в пиксели
      const w = w_norm * canvasElement.width;
      const h = h_norm * canvasElement.height;
        // x-координата должна быть зеркальной для правильного позиционирования CSS
        const x_pixel = (1 - sx - w_norm) * canvasElement.width; 
        const y_pixel = sy * canvasElement.height;
        
        const cx_pixel = x_pixel + w / 2;
        const cy_pixel = y_pixel + h / 2;

      // угол наклона плеч
      const dx = (R_SH.x - L_SH.x) * canvasElement.width;
      const dy = (R_SH.y - L_SH.y) * canvasElement.height;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      lastBox = { x: x_pixel, y: y_pixel, w, h, angle, cx: cx_pixel, cy: cy_pixel };

      // Debug: рамка (рисуем на canvas, который был возвращен в нормальное состояние)
      canvasCtx.save();
      canvasCtx.translate(lastBox.cx, lastBox.cy);
      canvasCtx.rotate((-lastBox.angle * Math.PI) / 180); // Угол должен быть инвертирован из-за зеркала
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
      // Обратите внимание: угол поворота в CSS не инвертируем, т.к. он соответствует повороту головы/туловища
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

    try {
        camera = new Camera(videoElement, {
            onFrame: async () => {
                await pose.send({ image: videoElement });
            },
            width: 1280,
            height: 720
        });

        camera.start();
        updateStatus("running");
    } catch (error) {
        // Ловим ошибку, если не удалось получить доступ к камере (например, отказано в разрешении)
        updateStatus("ERROR: " + error.name);
        console.error("Camera startup failed:", error);
        alert("Ошибка запуска камеры: " + error.message + ". Убедитесь, что разрешили доступ в настройках браузера.");
    }
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

// Инициализация (но не старт) при загрузке
window.addEventListener("load", () => {
  createPose();
  updateStatus("ready");
});
