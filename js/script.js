/* ==========================================================================
   SUBSPACESELINKLABS - CORE VISUAL ENGINE LOOP
   ========================================================================== */

const canvas = document.getElementById('animatedCanvas');
const ctx = canvas.getContext('2d');

// Grid configuration metrics
let dots = [];
const maxDots = 45;
const connectionDistance = 110;

// Initialize grid telemetry node vectors
class TelemetryNode {
  constructor(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    // Slow, drifting scifi technical velocity mechanics
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.radius = Math.random() * 2 + 1;
  }

  update(w, h) {
    this.x += this.vx;
    this.y += this.vy;

    // Fluid boundary bounce logic
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(41, 171, 226, 0.7)'; // Cyberpunk neon blue nodes
    ctx.fill();
  }
}

// Populate the vector field matrix arrays
function initTelemetry() {
  dots = [];
  for (let i = 0; i < maxDots; i++) {
    dots.push(new TelemetryNode(canvas.width, canvas.height));
  }
}

// Master engine rendering frame sequence
function renderEngineFrame() {
  // Clear layout with a soft trailing slate transparency block for smooth motion
  ctx.fillStyle = 'rgba(11, 11, 16, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Draw interconnected data grid relay lines
  for (let i = 0; i < dots.length; i++) {
    for (let n = i + 1; n < dots.length; n++) {
      const dx = dots[i].x - dots[n].x;
      const dy = dots[i].y - dots[n].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < connectionDistance) {
        // Linear transparency calculation based on node distance proximity
        const alpha = (1 - distance / connectionDistance) * 0.15;
        ctx.beginPath();
        ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(dots[n].x, dots[n].y);
        ctx.strokeStyle = `rgba(41, 171, 226, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // 2. Render and update structural vector node objects
  dots.forEach(node => {
    node.update(canvas.width, canvas.height);
    node.draw();
  });

  // 3. Overlay the central command text matrix block
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '1px';
  
  // Responsive text wrapping call
  wrapText(ctx, "******SubSpaceLinkLabs****** System Initialization Matrix", canvas.width / 2, canvas.height / 2, canvas.width - 40, 28);

  // Request next display re-draw synchronization frame
  requestAnimationFrame(renderEngineFrame);
}

// Helper algorithm to handle text wrapping on canvas layouts
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = context.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  let totalHeight = lines.length * lineHeight;
  let startY = y - (totalHeight / 2) + (lineHeight / 2);

  for (let i = 0; i < lines.length; i++) {
    context.fillText(lines[i], x, startY + (i * lineHeight));
  }
}

// Adaptive mobile layout resolution adjustment handler
function resizeCanvas() {
    // Syncs the internal rendering resolution coordinates to the browser frame
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initTelemetry();
}

}

// Bind lifecycle listeners
window.addEventListener('resize', resizeCanvas);

// Initialize system boot execution
resizeCanvas();
requestAnimationFrame(renderEngineFrame);
