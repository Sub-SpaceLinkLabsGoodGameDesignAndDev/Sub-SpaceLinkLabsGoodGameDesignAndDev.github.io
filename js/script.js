/* ==========================================================================
   SUBSPACESELINKLABS - PROCEDURAL MATRIX SCREEN CLEANER ENGINE
   ========================================================================== */
let dots = []; 
const maxDots = 110;              
const connectionDistance = 140;   

// Color themes array to cycle through as the screen gets completely "cleaned"
const matrixPalettes = [
    { primary: 'rgba(41, 171, 226, ', trail: 'rgba(2, 8, 18, 0.04)' },   // Neon Blue Matrix
    { primary: 'rgba(255, 0, 255, ', trail: 'rgba(7, 7, 15, 0.04)' },   // Magenta Hack Workbench
    { primary: 'rgba(230, 126, 34, ', trail: 'rgba(15, 8, 2, 0.04)' },   // Orange Staging Alert
    { primary: 'rgba(46, 204, 113, ', trail: 'rgba(2, 15, 7, 0.04)' }    // Godot Vector Green
];
let currentPaletteIndex = 0;
let cleanCycleProgress = 0;

class TelemetryNode { 
    constructor(w, h) { 
        this.x = Math.random() * w; 
        this.y = Math.random() * h; 
        this.vx = (Math.random() - 0.5) * 0.9; // Boosted speed slightly to sweep lines cleanly
        this.vy = (Math.random() - 0.5) * 0.9; 
        this.radius = Math.random() * 2 + 1; 
    } 
    update(w, h) { 
        this.x += this.vx; 
        this.y += this.vy; 
        
        if (this.x < 0 || this.x > w) this.vx *= -1; 
        if (this.y < 0 || this.y > h) this.vy *= -1; 
    } 
    draw(ctx, colorString) { 
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

    // Track active colors based on our theme cycle index
    const activePalette = matrixPalettes[currentPaletteIndex];

    // 🚀 THE SCREEN CLEANER ACCUMULATOR: Intentionally scales up the resolution matrix context
    // This feeds the sub-pixel trailing bug to build up thick blooming color sweeps across the window!
    ctx.scale(dpr, dpr);

    // Blends paths smoothly into glowing energy layers
    ctx.globalCompositeOperation = 'screen';

    // Render wireframe grid lines
    for (let i = 0; i < dots.length; i++) { 
        for (let n = i + 1; n < dots.length; n++) { 
            const dx = dots[i].x - dots[n].x; 
            const dy = dots[i].y - dots[n].y; 
            const distance = Math.sqrt(dx * dx + dy * dy); 
            
            if (distance < connectionDistance) { 
                const alpha = (1 - distance / connectionDistance) * 0.18; 
                
                // Draw vector paths continuously without running beginPath() on every sub-element
                // This guarantees the paths compile together into massive expanding paint fields!
                ctx.moveTo(dots[i].x, dots[i].y); 
                ctx.lineTo(dots[n].x, dots[n].y); 
                
                ctx.strokeStyle = `${activePalette.primary}${alpha})`; 
                ctx.lineWidth = 1.4; 
                ctx.stroke(); 
            } 
        } 
    } 

    // Draw moving vector node particles
    dots.forEach(node => { 
        node.update(w, h);
        node.draw(ctx); 
        ctx.fillStyle = `${activePalette.primary}0.85)`;
        ctx.fill();
    }); 

    // 🚀 TIME TO CYLCLE WIPE: Track frames to reset the slate once it saturates
    cleanCycleProgress++;
    
    // Roughly every 12-15 seconds (750 execution loops), sweep the screen and shift the palette color
    if (cleanCycleProgress > 750) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Hard reset the scaling multiplier
        ctx.globalCompositeOperation = 'source-over';
        
        // Solid wipe using the matching theme color block to flush away artifacting streaks cleanly
        ctx.fillStyle = activePalette.trail.replace('0.04', '1'); 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Increment theme array index loop pointer
        currentPaletteIndex = (currentPaletteIndex + 1) % matrixPalettes.length;
        cleanCycleProgress = 0;
        
        // Re-scatter vector points to generate unique cleaning pathways for the next wave
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
