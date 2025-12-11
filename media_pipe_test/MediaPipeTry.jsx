<video ref={videoRef} className="mp-video" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="mp-canvas" />
        {/* overlay clothing uses lastBox */}
        <img
          src="/assets/dress.png"
          alt="dress-overlay"
          className="mp-dress"
          style={
            lastBox
              ? {
                  left: ${lastBox.cx}px,
                  top: ${lastBox.cy}px,
                  width: ${lastBox.w * 1.05}px,
                  transform: translate(-50%,-50%) rotate(${lastBox.angle}deg)
                }
              : { display: "none" }
          }
        />
      </div>
      <div className="mp-try-info">
        <p>Camera running: {isRunning ? "yes" : "no"}</p>
        <p>If overlay not visible — move further from camera or allow permissions.</p>
      </div>
    </div>
  );
}
