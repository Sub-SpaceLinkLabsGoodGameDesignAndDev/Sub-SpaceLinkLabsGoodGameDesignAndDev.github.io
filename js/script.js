/* ==========================================================================
   SUBSPACESELINKLABS - CORE VISUAL ENGINE LOOP (OPTIMIZED BACKGROUND MESH)
   ========================================================================== */
let dots = []; 
const maxDots = 120;              // 🚀 Packed tighter for a dense network grid
const connectionDistance = 140;   // 🚀 Bridges nodes cleanly together over screen distances

class TelemetryNode { 
    constructor(w, h) { 
        this.x = Math.random() * w; 
        this.y = Math.random() * h; 
        this.vx = (Math.random() - 0.5) * 0.8; 
        this.vy = (Math.random() - 0.5) * 0.8; 
        this.radius = Math.random() * 2 + 1; 
    } 
    update(w, h) { 
        this.x += this.vx; 
        this.y += this.vy; 
        
        // Bounce tracking mechanics
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

// 🚀 FIXED: Populates coordinates matching the scaled canvas bounds perfectly
function initTelemetry() { 
    const canvas = document.getElementById('animatedCanvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    dots = []; 
    for (let i = 0; i < maxDots; i++) { 
        // Spawns nodes cleanly inside the real bounding box layout
        dots.push(new TelemetryNode(rect.width, rect.height)); 
    } 
} 

function resizeCanvas() { 
    const canvas = document.getElementById('animatedCanvas'); 
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Lock canvas internal dimensions strictly to layout scale
    canvas.width = rect.width * dpr; 
    canvas.height = rect.height * dpr; 
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.scale(dpr, dpr);
    }
} 

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

    // 🚀 THE TRAIL GENERATOR: Draws a faint slate with a tiny alpha to build glowing neon trails
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 8, 18, 0.08)'; 
    ctx.fillRect(0, 0, w, h); 

    // Enable blooming composition layering
    ctx.globalCompositeOperation = 'screen';

    // Render wireframe grid lines
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

    // Draw vector particles
    dots.forEach(node => { 
        node.update(w, h); 
        node.draw(ctx); 
    }); 

    requestAnimationFrame(renderEngineFrame); 
}

// Event hooks matrix
window.addEventListener('resize', () => {
    resizeCanvas();
    initTelemetry();
}); 

// Master bootstrap loop
window.addEventListener('load', () => {
    resizeCanvas(); 
    initTelemetry(); 
    requestAnimationFrame(renderEngineFrame);

    // ============================================================================
    // SUB-SPACE LINK LABS DEVLOG STREAM INTERACTIVE TAB TOGGLE
    // ============================================================================
    const btnHistorian = document.getElementById("btn-historian-stream");
    const btnLedger = document.getElementById("btn-ledger-stream");
    const panelHistorian = document.getElementById("panel-historian-stream");
    const panelLedger = document.getElementById("panel-ledger-stream");

    if (btnHistorian && btnLedger && panelHistorian && panelLedger) {
        btnHistorian.addEventListener("click", () => {
            panelHistorian.style.display = "block";
            panelLedger.style.display = "none";
            btnHistorian.style.color = "#fff";
            btnHistorian.style.borderBottom = "2px solid rgb(206, 13, 13)";
            btnLedger.style.color = "#666";
            btnLedger.style.borderBottom = "none";
        });

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
