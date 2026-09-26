/* ==========================================================================
   SUBSPACESELINKLABS - CORE VISUAL ENGINE LOOP (NEON TRAILS CONFIG)
   ========================================================================== */
let dots = []; 
const maxDots = 120;              
const connectionDistance = 140;   

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
        
        if (this.x < 0 || this.x > w) this.vx *= -1; 
        if (this.y < 0 || this.y > h) this.vy *= -1; 
    } 
    draw(ctx) { 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
    } 
} 

function initTelemetry() { 
    const canvas = document.getElementById('animatedCanvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    dots = []; 
    for (let i = 0; i < maxDots; i++) { 
        dots.push(new TelemetryNode(rect.width, rect.height)); 
    } 
} 

function resizeCanvas() { 
    const canvas = document.getElementById('animatedCanvas'); 
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
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

    // 🚀 1. SMOOTH TRAIL GENERATOR: Instead of clearRect, we paint a faint transparent slate.
    // A low alpha (0.12) makes old lines smoothly dissolve into fading neon tails!
    ctx.globalCompositeOperation = 'source-over';
ctx.fillStyle = 'rgba(2, 8, 18, 0.05)'; // 🚀 Lower alpha allows beautiful, long trails!
ctx.fillRect(0, 0, w, h); 
   
    // 🚀 2. BLOOMING HUB EFFECTS: Intersecting lines illuminate into neon energy clusters
    ctx.globalCompositeOperation = 'screen';

    // Render wireframe grid lines
    for (let i = 0; i < dots.length; i++) { 
        for (let n = i + 1; n < dots.length; n++) { 
            const dx = dots[i].x - dots[n].x; 
            const dy = dots[i].y - dots[n].y; 
            const distance = Math.sqrt(dx * dx + dy * dy); 
            
            if (distance < connectionDistance) { 
                const alpha = (1 - distance / connectionDistance) * 0.35; 
                
                // 🚀 3. PATH RESET GUARD: Keeps your canvas memory completely clean of static patches!
                ctx.beginPath(); 
                ctx.moveTo(dots[i].x, dots[i].y); 
                ctx.lineTo(dots[n].x, dots[n].y); 
                
                ctx.strokeStyle = `rgba(41, 171, 226, ${alpha})`; 
                ctx.lineWidth = 1.3; 
                ctx.stroke(); 
            } 
        } 
    } 

    // Draw vector particles
    dots.forEach(node => { 
        node.update(w, h);
        
        ctx.beginPath(); 
        node.draw(ctx); 
        ctx.fillStyle = 'rgba(41, 171, 226, 0.85)';
        ctx.fill();
    }); 

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(renderEngineFrame); 
}

window.addEventListener('resize', () => {
    resizeCanvas();
    initTelemetry();
}); 

window.addEventListener('load', () => {
    resizeCanvas(); 
    initTelemetry(); 
    requestAnimationFrame(renderEngineFrame);

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
