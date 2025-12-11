mediapipe-test/index.html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>MediaPipe Try — TryOn Test</title>
  <link rel="stylesheet" href="mediapipe-try.css" />
</head>
<body>
  <h2 style="text-align:center;">MediaPipe Pose — Try-on test (isolated)</h2>
  <div class="mp-root">
    <div class="mp-video-wrap">
      <video id="input_video" autoplay playsinline muted></video>
      <canvas id="output_canvas"></canvas>
      <img id="dressOverlay" src="assets/dress.png" alt="dress" />
    </div>
    <div class="mp-info">
      <button id="startBtn">Start camera</button>
      <button id="stopBtn">Stop camera</button>
      <p id="status">Status: stopped</p>
      <p>Если overlay не видно — разреши камеру, отойди дальше от камеры и убедись, что на картинке прозрачный фон.</p>
    </div>
  </div>

  <!-- MediaPipe Pose (cdn) -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/pose.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
  <script src="mediapipe-try.js"></script>
</body>
</html>
