(function () {
  const canvas = document.getElementById("grid");
  const ctx = canvas.getContext("2d");

  const gridSize = 120;
  const lineColor = "rgba(255,255,255,0.22)";
  let mouse = { x: null, y: null };
  let dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Vertical lines
    for (let x = -gridSize; x <= width + gridSize; x += gridSize) {
      ctx.beginPath();
      for (let y = -gridSize; y <= height + gridSize; y += gridSize) {
        let dx = mouse.x - x;
        let dy = mouse.y - y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let pullStrength = Math.max(0, 400 - dist) / 15;
        let offsetX = (dx / dist || 0) * pullStrength;
        let offsetY = (dy / dist || 0) * pullStrength;

        if (y === -gridSize) {
          ctx.moveTo(x + offsetX, y + offsetY);
        } else {
          ctx.lineTo(x + offsetX, y + offsetY);
        }
      }
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = -gridSize; y <= height + gridSize; y += gridSize) {
      ctx.beginPath();
      for (let x = -gridSize; x <= width + gridSize; x += gridSize) {
        let dx = mouse.x - x;
        let dy = mouse.y - y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let pullStrength = Math.max(0, 100 - dist) / 15;
        let offsetX = (dx / dist || 0) * pullStrength;
        let offsetY = (dy / dist || 0) * pullStrength;

        if (x === -gridSize) {
          ctx.moveTo(x + offsetX, y + offsetY);
        } else {
          ctx.lineTo(x + offsetX, y + offsetY);
        }
      }
      ctx.stroke();
    }
  }

  function animate() {
    drawGrid();
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  resizeCanvas();
  animate();
})();
