/* ==========================================================================
   SUBSPACESELINKLABS - PROCEDURAL MATRIX SCREEN CLEANER ENGINE (FIXED)
   ========================================================================== */
let dots = []; 
const maxDots = 75;               // Balanced density for fluid, elegant line coverage
const connectionDistance = 140;   

// Color configurations: We include a tiny, matching tint fader for each theme
const matrixPalettes = [
    { name: "Neon Blue", line: "rgba(41, 171, 226, ", dot: "rgba(41, 171, 226, 0.9)", tint: "rgba(41, 171, 226, 0.003)", blank: "#020812" },
    { name: "Magenta Workbench", line: "rgba(255, 0, 255, ", dot: "rgba(255, 0, 255, 0.9)", tint: "rgba(255, 0, 255, 0.003)", blank: "#07020d" },
    { name: "Orange Alert", line: "rgba(230, 126, 34, ", dot: "rgba(230, 126, 34, 0.9)", tint: "rgba(230, 126, 34, 0.003)", blank: "#0d0702" },
    { name: "Godot Matrix Green", line: "rgba(46, 204, 113, ", dot: "rgba(46, 204, 113, 0.9)", tint: "rgba(46, 204, 113, 0.003)", blank: "#020d06" }
];
let currentPaletteIndex = 0;
let frameCount = 0;

class TelemetryNode { 
    constructor(w, h) { 
        this.x = Math.random() * w; 
        this.y = Math.random() * h; 
        this.vx = (Math.random() - 0.5) * 1.5; // Quick movement to draw smooth trails
        this.vy = (Math.random() - 0.5) * 1.5; 
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

    const activeTheme = matrixPalettes[currentPaletteIndex];

    // 🚀 1. SAFE MATRIX RESET: Keeps hardware transformations 1:1 on every frame loop
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 🚀 2. THE SECRET INGREDIENT (LIQUID ACCUMULATOR): Instead of clearing, we paint a tiny,
    // nearly invisible amount of the current color. This forces the screen to gradually "wash" 
    // and saturate completely into a solid colored background smoothly over 12 seconds with NO lag!
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = activeTheme.tint; 
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    // Apply the high-DPI scaling matrix for crisp path placement
    ctx.scale(dpr, dpr);

    // Turn on blending so overlapping line vectors leave glowing neon streaks
    ctx.globalCompositeOperation = 'screen';

    // Render wireframe matrix paths
    for (let i = 0; i < dots.length; i++) { 
        for (let n = i + 1; n < dots.length; n++) { 
            const dx = dots[i].x - dots[n].x; 
            const dy = dots[i].y - dots[n].y; 
            const distance = Math.sqrt(dx * dx + dy * dy); 
            
            if (distance < connectionDistance) { 
                const alpha = (1 - distance / connectionDistance) * 0.12; 
                
                ctx.beginPath(); 
                ctx.moveTo(dots[i].x, dots[i].y); 
                ctx.lineTo(dots[n].x, dots[n].y); 
                
                ctx.strokeStyle = `${activeTheme.line}${alpha})`; 
                ctx.lineWidth = 1.2; 
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

    // 🚀 3. COLOR SWEEP SYSTEM RESET
    frameCount++;
    
    // After ~13 seconds (800 loops), the screen is completely painted solid.
    // Flash-clean the canvas buffer and swap out to the next workspace palette!
    if (frameCount > 800) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        
        // Find the next palette we are moving into
        const nextPaletteIndex = (currentPaletteIndex + 1) % matrixPalettes.length;
        const nextTheme = matrixPalettes[nextPaletteIndex];
        
        // Solid wipe using the incoming theme's dark blank color to clear out the canvas cleanly
        ctx.fillStyle = nextTheme.blank; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Advance the loop pointer and reset clock variables
        currentPaletteIndex = nextPaletteIndex;
        frameCount = 0;
        
        // Re-scatter the data telemetry points to draw unique sweeping pathways
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
