/* ==========================================================================
   SUBSPACESELINKLABS - CORE VISUAL ENGINE LOOP
   ========================================================================== */

// Scope our canvas variables so they initialize only after HTML structural loads match
let canvas;
let ctx;
let dots = []; 
const maxDots = 45; 
const connectionDistance = 110; 

// Initialize grid telemetry node vectors 
class TelemetryNode { 
    constructor(w, h) { 
        this.x = Math.random() * w; 
        this.y = Math.random() * h; 
        this.vx = (Math.random() - 0.5) * 0.4; 
        this.vy = (Math.random() - 0.5) * 0.4; 
        this.radius = Math.random() * 2 + 1; 
    } 
    update(w, h) { 
        this.x += this.vx; 
        this.y += this.vy; 
        if (this.x < 0 || this.x > w) this.vx *= -1; 
        if (this.y < 0 || this.y > h) this.vy *= -1; 
    } 
    draw() { 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fillStyle = 'rgba(41, 171, 226, 0.7)'; 
        ctx.fill(); 
    } 
} 

function initTelemetry() { 
    dots = []; 
    for (let i = 0; i < maxDots; i++) { 
        dots.push(new TelemetryNode(canvas.width, canvas.height)); 
    } 
} 

function renderEngineFrame() { 
    ctx.fillStyle = 'rgba(11, 11, 16, 0.2)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    for (let i = 0; i < dots.length; i++) { 
        for (let n = i + 1; n < dots.length; n++) { 
            const dx = dots[i].x - dots[n].x; 
            const dy = dots[i].y - dots[n].y; 
            const distance = Math.sqrt(dx * dx + dy * dy); 
            if (distance < connectionDistance) { 
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

    dots.forEach(node => { 
        node.update(canvas.width, canvas.height); 
        node.draw(); 
    }); 

    requestAnimationFrame(renderEngineFrame); 
} 

function resizeCanvas() { 
    if (!canvas) return;
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    initTelemetry(); 
} 

// CRITICAL SAFE BOOT: Safe check to guarantee HTML elements exist before reading context
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('animatedCanvas'); 
    
    if (canvas) {
        ctx = canvas.getContext('2d'); 
        window.addEventListener('resize', resizeCanvas); 
        resizeCanvas(); 
        requestAnimationFrame(renderEngineFrame);
    } else {
        console.error("Matrix Core Link Error: Element with ID 'animatedCanvas' not found in document layout.");
    }
});
