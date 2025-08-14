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

//Object chasing mouse cursor

const cursorChar = document.querySelector(".cursor-char");

let mouseX = 0,
  mouseY = 0;
let charX = 0,
  charY = 0;
const chaseSpeed = 0.08; // Chase speed

// let orbitAngle = 0;
// const orbitRadius = 30;
// const orbitSpeed = 0.03;

let spinAngle = 0;
const spinSpeed = 5;

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  charX += (mouseX - charX) * chaseSpeed;
  charY += (mouseY - charY) * chaseSpeed;

  //revolution
  // orbitAngle += orbitSpeed;
  // const offsetX = Math.cos(orbitAngle) * orbitRadius;
  // const offsetY = Math.sin(orbitAngle) * orbitRadius;

  const offsetX = 0;
  const offsetY = 0;

  //rotate
  spinAngle = (spinAngle + spinSpeed) % 360;

  cursorChar.style.left = charX + offsetX + "px";
  cursorChar.style.top = charY + offsetY + "px";
  cursorChar.style.transform = `translate(-25%, -25%) rotate(${spinAngle}deg)`;

  requestAnimationFrame(animateCursor);
}

animateCursor();

const icons = document.querySelectorAll(".icon");
const speeds = [];
const positions = [];

icons.forEach((icon) => {
  // Random initial position for each icon
  const x = Math.random() * (window.innerWidth - icon.offsetWidth);
  const y = Math.random() * (window.innerHeight - icon.offsetHeight);

  positions.push({ x, y });
  speeds.push({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 });

  icon.style.left = `${x}px`;
  icon.style.top = `${y}px`;

  icon.addEventListener("mouseenter", () => {
    icon.classList.add("vibrate");
    speeds[Array.from(icons).indexOf(icon)] = { x: 0, y: 0 }; // stop moving
  });

  icon.addEventListener("mouseleave", () => {
    icon.classList.remove("vibrate");
    // Resume movement
    speeds[Array.from(icons).indexOf(icon)] = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
    };
  });
});

function animateIcons() {
  icons.forEach((icon, i) => {
    let pos = positions[i];
    let speed = speeds[i];

    // Update pos
    pos.x += speed.x;
    pos.y += speed.y;

    // Bounce screen
    if (pos.x <= 0 || pos.x + icon.offsetWidth >= window.innerWidth)
      speed.x *= -1;
    if (pos.y <= 0 || pos.y + icon.offsetHeight >= window.innerHeight)
      speed.y *= -1;

    icon.style.left = `${pos.x}px`;
    icon.style.top = `${pos.y}px`;
  });
  requestAnimationFrame(animateIcons);
}
animateIcons();

// glass selector
// index.js
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
