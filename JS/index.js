(function () {
        const canvas = document.getElementById("grid");
        const ctx = canvas.getContext("2d");

        const gridSize = 120;
        const lineColor = "rgba(255,255,255,0.22)";

        function resizeCanvas() {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = window.innerWidth * dpr;
          canvas.height = window.innerHeight * dpr;
          canvas.style.width = window.innerWidth + "px";
          canvas.style.height = window.innerHeight + "px";
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawGrid();
        }

        function drawGrid() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1;

          // Vertical lines
          for (
            let x = -2;
            x <= canvas.width / (window.devicePixelRatio || 1);
            x += gridSize
          ) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, canvas.height);
            ctx.stroke();
          }

          // Horizontal lines
          for (
            let y = 7;
            y <= canvas.height / (window.devicePixelRatio || 1);
            y += gridSize
          ) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(canvas.width, y + 0.5);
            ctx.stroke();
          }
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
      })();