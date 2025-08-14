(function () {
  const canvas = document.getElementById("grid");
  const ctx = canvas.getContext("2d");

  const gridSize = 115;
  const lineColor = "rgba(255, 255, 255, 0.25)";
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

// glass selector
// about.js
(function () {
  const navLinks = document.querySelectorAll(".nav .outerbox a.nav-link");
  const selector = document.querySelector(".nav .innerbox");
  const outer = document.querySelector(".nav .outerbox");

  function updateSelector(link, instant = false) {
    const navRect = outer.getBoundingClientRect();
    const liRect = link.parentElement.getBoundingClientRect();
    const leftPos = liRect.left - navRect.left;
    const width = liRect.width;

    if (instant) selector.style.transition = "none";
    selector.style.left = `${leftPos}px`;
    selector.style.width = `${width}px`;
    if (instant) {
      requestAnimationFrame(() => {
        selector.style.transition = "all 0.4s cubic-bezier(0.4,0,0.2,1)";
      });
    }
  }

  function setInitialActive() {
    // Use whatever link is already marked .active in the HTML
    let activeLink =
      document.querySelector(".nav .outerbox a.nav-link.active") || navLinks[0];
    navLinks.forEach((l) => l.classList.remove("active"));
    activeLink.classList.add("active");
    updateSelector(activeLink, true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setInitialActive();
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        updateSelector(link, false);
        setTimeout(() => {
          window.location.href = link.href;
        }, 400);
      });
    });

    window.addEventListener("resize", () => {
      const current = document.querySelector(
        ".nav .outerbox a.nav-link.active"
      );
      if (current) updateSelector(current, true);
    });
  });
})();
