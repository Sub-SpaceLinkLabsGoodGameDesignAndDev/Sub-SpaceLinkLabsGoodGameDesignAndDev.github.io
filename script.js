const canvas = document.getElementById('animatedCanvas');
const ctx = canvas.getContext('2d');

let currentBgColor = '#000000'; 

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  // Increase height dynamically if the text wraps into multiple lines
  canvas.height = canvas.width < 500 ? 180 : 130; 
  drawCanvasContent();
}

// Helper function to handle multi-line text wrapping on canvas
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

  // Center the block of lines vertically
  let startY = y - ((lines.length - 1) * lineHeight) / 2;

  for (let i = 0; i < lines.length; i++) {
    context.fillText(lines[i].trim(), x, startY + (i * lineHeight));
  }
}

function drawCanvasContent() {
  // 1. Draw Background
  ctx.fillStyle = currentBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Adjust font size and line height based on screen size
  const isSmallScreen = canvas.width < 500;
  const fontSize = isSmallScreen ? '24px' : '36px';
  const lineHeight = isSmallScreen ? 32 : 44;

  // 3. Draw Text with automatic wrapping
  ctx.fillStyle = '#ffffff'; 
  ctx.font = `bold ${fontSize} sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Leaves a 20px padding margin on the left/right edges
  const maxWidth = canvas.width - 40; 
  const textString = 'SUB-SPACE LINK LABS GOOD GAME DESIGN & DEVLOGS';

  wrapText(ctx, textString, canvas.width / 2, canvas.height / 2, maxWidth, lineHeight);
}

function updateCanvasColors() {
  currentBgColor = getRandomColor();
  drawCanvasContent();
}

window.onload = function() {
  resizeCanvas();
  setInterval(updateCanvasColors, 1000); 
  window.addEventListener('resize', resizeCanvas);
};