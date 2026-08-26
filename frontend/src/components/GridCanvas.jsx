import React, { useEffect, useRef } from "react";

function GridCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let grid = [];
    const spacing = 40;
    const mouse = { x: -1000, y: -1000 };
    const maxDistance = 200;
    const pullStrength = 0.4;
    let cols = 0;
    let rows = 0;

    function initGrid() {
      grid = [];
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
          grid[i][j] = {
            baseX: i * spacing,
            baseY: j * spacing,
            x: i * spacing,
            y: j * spacing,
          };
        }
      }
    }

    function handleResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initGrid();
    }

    function handleMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function handleMouseOut() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    initGrid();

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Update particle positions based on mouse distance
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dot = grid[i]?.[j];
          if (!dot) continue;

          const dx = mouse.x - dot.baseX;
          const dy = mouse.y - dot.baseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const targetX = dot.baseX + dx * force * pullStrength;
            const targetY = dot.baseY + dy * force * pullStrength;
            dot.x += (targetX - dot.x) * 0.2;
            dot.y += (targetY - dot.y) * 0.2;
          } else {
            dot.x += (dot.baseX - dot.x) * 0.1;
            dot.y += (dot.baseY - dot.y) * 0.1;
          }
        }
      }

      // Draw faint connecting grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dot = grid[i]?.[j];
          if (!dot) continue;

          if (i < cols - 1 && grid[i + 1]?.[j]) {
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(grid[i + 1][j].x, grid[i + 1][j].y);
          }
          if (j < rows - 1 && grid[i]?.[j + 1]) {
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(grid[i][j + 1].x, grid[i][j + 1].y);
          }
        }
      }
      ctx.stroke();

      // Draw interaction dots
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dot = grid[i]?.[j];
          if (!dot) continue;

          const dx = mouse.x - dot.baseX;
          const dy = mouse.y - dot.baseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + force * 0.7})`;
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          }
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

export default React.memo(GridCanvas);
