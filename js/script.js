/* ==========================================================================
   SUBSPACESELINKLABS - CORE VISUAL ENGINE LOOP (OPTIMIZED BACKGROUND MESH)
   ========================================================================== */
let dots = []; 
const maxDots = 85;               // 🚀 Increased from 45 to fill out the full background nicely
const connectionDistance = 140;   // 🚀 Increased from 110 so nodes bridge together over longer distances

class TelemetryNode { 
    constructor(w, h) { 
        this.x = Math.random() * w; 
        this.y = Math.random() * h; 
        // 🚀 Increased speed slightly so trails don't puddle up into ugly static light patches
        this.vx = (Math.random() - 0.5) * 0.9; 
        this.vy = (Math.random() - 0.5) * 0.9; 
        this.radius = Math.random() * 2.5 + 1.5; 
    } 
    update(w, h) { 
        this.x += this.vx; 
        this.y += this.vy; 
        
        // 🚀 Clean bounce physics to prevent nodes from gathering on screen edges
        if (this.x < 0 || this.x > w) this.vx *= -1; 
        if (this.y < 0 || this.y > h) this.vy *= -1; 
    } 
    draw(ctx) { 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fillStyle = 'rgba(41, 171, 226, 0.85)'; 
        ctx.fill(); 
    } 
} 

// Populate vector arrays using the exact window widths
function initTelemetry() { 
    dots = []; 
    for (let i = 0; i < maxDots; i++) { 
        dots.push(new TelemetryNode(window.innerWidth, window.innerHeight)); 
    } 
} 

function resizeCanvas() { 
    const canvas = document.getElementById('animatedCanvas'); 
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set internal resolution scaled precisely to screen DPI
    canvas.width = rect.width * dpr; 
    canvas.height = rect.height * dpr; 
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.scale(dpr, dpr);
    }
} 

// 2. UPDATE YOUR RENDERING FRAME LOOP TO THIS:
function renderEngineFrame() { 
    const canvas = document.getElementById('animatedCanvas');
    if (!canvas) {
        requestAnimationFrame(renderEngineFrame);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // 🚀 THE TRAIL GENERATOR: Draws a semi-transparent slate over the screen.
    // Instead of clearRect, this lets old nodes slowly fade out into trails!
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 8, 18, 0.08)'; // Low alpha (0.08) creates long, smooth trails!
    ctx.fillRect(0, 0, w, h); 

    // Switch to lighting blend mode so overlapping connections bloom beautifully
    ctx.globalCompositeOperation = 'screen';

    // Render data wireframe grid paths
    for (let i = 0; i < dots.length; i++) { 
        for (let n = i + 1; n < dots.length; n++) { 
            const dx = dots[i].x - dots[n].x; 
            const dy = dots[i].y - dots[n].y; 
            const distance = Math.sqrt(dx * dx + dy * dy); 
            
            if (distance < connectionDistance) { 
                const alpha = (1 - distance / connectionDistance) * 0.25; 
                ctx.beginPath(); 
                ctx.moveTo(dots[i].x, dots[i].y); 
                ctx.lineTo(dots[n].x, dots[n].y); 
                
                ctx.strokeStyle = `rgba(41, 171, 226, ${alpha})`; 
                ctx.lineWidth = 1.2; 
                ctx.stroke(); 
            } 
        } 
    } 

    // Draw moving vector node particles
    dots.forEach(node => { 
        node.update(w, h); 
        node.draw(ctx); 
    }); 

    requestAnimationFrame(renderEngineFrame); 
}

// ============================================================================
// SUB-SPACE LINK LABS DEVLOG STREAM INTERACTIVE TAB TOGGLE
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    const btnHistorian = document.getElementById("btn-historian-stream");
    const btnLedger = document.getElementById("btn-ledger-stream");
    const panelHistorian = document.getElementById("panel-historian-stream");
    const panelLedger = document.getElementById("panel-ledger-stream");

    if (btnHistorian && btnLedger && panelHistorian && panelLedger) {
        // ACTIVATE PUBLIC CHRONICLES VIEW
        btnHistorian.addEventListener("click", () => {
            panelHistorian.style.display = "block";
            panelLedger.style.display = "none";
            btnHistorian.style.color = "#fff";
            btnHistorian.style.borderBottom = "2px solid rgb(206, 13, 13)";
            btnLedger.style.color = "#666";
            btnLedger.style.borderBottom = "none";
        });

        // ACTIVATE BEHIND-THE-SCENES LEDGER VIEW (LIGHTS UP IN MAGENTA)
        btnLedger.addEventListener("click", () => {
            panelHistorian.style.display = "none";
            panelLedger.style.display = "block";
            btnLedger.style.color = "#ff00ff";
            btnLedger.style.borderBottom = "2px solid #ff00ff";
            btnHistorian.style.color = "#666";
            btnHistorian.style.borderBottom = "none";
        });
    }
});
