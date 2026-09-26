/* ==========================================================================
   SUBSPACESELINKLABS - CORE PROCEDURAL BACKGROUND WIPE ENGINE
   ========================================================================== */
let dots = []; 
const maxDots = 90;              // Balanced density to maintain 60 FPS smoothly
const connectionDistance = 135;   

// Color themes matrix arrays to sweep through natively
const matrixPalettes = [
    { name: "Neon Blue", line: "rgba(41, 171, 226, ", dot: "rgba(41, 171, 226, 0.9)" },
    { name: "Magenta Workbench", line: "rgba(255, 0, 255, ", dot: "rgba(255, 0, 255, 0.9)" },
    { name: "Orange Alert", line: "rgba(230, 126, 34, ", dot: "rgba(230, 126, 34, 0.9)" },
    { name: "Godot Matrix Green", line: "rgba(46, 204, 113, ", dot: "rgba(46, 204, 113, 0.9)" }
];
let currentPaletteIndex = 0;
let frameCount = 0;

class TelemetryNode { 
    constructor(w, h) { 
        this.x = Math.random() * w; 
        this.y = Math.random() * h; 
        this.vx = (Math.random() - 0.5) * 1.2; // Boosted speed slightly for faster color sweeping
        this.vy = (Math.random() - 0.5) * 1.2; 
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

    // 🚀 MEMORY PROTECTION SAFETY SEALS:
    // Reset our transforms on every single frame so the resolution scaling NEVER multiplies exponentially!
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const activeTheme = matrixPalettes[currentPaletteIndex];

    // 🚀 INTERACTIVE BLOOM: Tell the GPU to stack color transparency paths natively.
    // Instead of locking up path loops, this bleeds the lines color into the canvas layer beautifully.
    ctx.globalCompositeOperation = 'screen';

    // Render wireframe matrix paths
    for (let i = 0; i < dots.length; i++) { 
        for (let n = i + 1; n < dots.length; n++) { 
            const dx = dots[i].x - dots[n].x; 
            const dy = dots[i].y - dots[n].y; 
            const distance = Math.sqrt(dx * dx + dy * dy); 
            
            if (distance < connectionDistance) { 
                // A subtle line opacity ensures the bleeding effect builds up gracefully over time
                const alpha = (1 - distance / connectionDistance) * 0.015; 
                
                // 🚀 PATH GUARD: Isolate line memory calculation states so browser memory never locks up
                ctx.beginPath(); 
                ctx.moveTo(dots[i].x, dots[i].y); 
                ctx.lineTo(dots[n].x, dots[n].y); 
                
                ctx.strokeStyle = `${activeTheme.line}${alpha})`; 
                ctx.lineWidth = 1.1; 
                ctx.stroke(); 
            } 
        } 
    } 

    // Draw vector tracking nodes
    dots.forEach(node => { 
        node.update(w, h);
        ctx.beginPath(); 
        node.draw(ctx); 
        ctx.fillStyle = activeTheme.dot;
        ctx.fill();
    }); 

    // 🚀 AUTOMATED SLATE WASH TRACKER
    frameCount++;
    
    // Every 900 frames (~15 seconds), cleanly flash erase the canvas and boot up the next terminal palette color
    if (frameCount > 900) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        
        // Drop a solid void black baseline layer to instantly flush out old pixel memory
        ctx.fillStyle = '#020812'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Cycle cleanly into the next theme array address link
        currentPaletteIndex = (currentPaletteIndex + 1) % matrixPalettes.length;
        frameCount = 0;
        
        // Scatter telemetry vectors to layout fresh pathways
        initTelemetry();
    }

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
