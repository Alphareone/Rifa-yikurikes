// --- AUDIO WEB API (EFECTOS Y FANFARRIA DE VICTORIA) ---
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playBeep(freq, type, duration) {
    try {
        initAudio();
        if(!audioCtx) return;
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

// Trompetas de victoria estilo fanfarria festiva
function playVictoryFanfare() {
    try {
        initAudio();
        if(!audioCtx) return;
        // Notas triunfales tipo fanfarria (Do - Mi - Sol - Do agudo con sostenido de cierre)
        const fanfareNotes = [
            { f: 523.25, d: 0.15 }, // Do
            { f: 659.25, d: 0.15 }, // Mi
            { f: 783.99, d: 0.15 }, // Sol
            { f: 1046.50, d: 0.4 }, // Do agudo
            { f: 783.99, d: 0.15 }, // Sol
            { f: 1046.50, d: 0.6 }  // Do agudo final extendido
        ];
        let delay = 0;
        fanfareNotes.forEach((note) => {
            setTimeout(() => {
                playBeep(note.f, 'triangle', note.d);
            }, delay);
            delay += note.d * 1000 * 0.85;
        });
    } catch(e) {}
}

// --- HUELLITAS Y DECORACIONES ANIMADAS EN FONDO ---
const bgContainer = document.getElementById('bgDecorations');
const pawSymbols = ['🐾', '🐱', '🐈', '✨', '🧶', '💖'];
for (let i = 0; i < 18; i++) {
    const paw = document.createElement('div');
    paw.className = 'bg-paw'; 
    paw.innerText = pawSymbols[Math.floor(Math.random() * pawSymbols.length)];
    paw.style.left = `${Math.random() * 100}%`;
    paw.style.animationDelay = `${Math.random() * 12}s`;
    paw.style.animationDuration = `${9 + Math.random() * 8}s`;
    bgContainer.appendChild(paw);
}

function switchTab(tabId, event) {
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

let currentOnCloseCallback = null;
function showWinner(val, prizeName, onClose) {
    // Reproducir fanfarria de trompetas triunfales
    playVictoryFanfare();

    // Lanzar efecto masivo de confites festivos con canvas-confetti
    try {
        confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#00f3ff', '#ff007f', '#ffe600', '#00ff88', '#9d00ff']
        });
    } catch(e) {}

    document.getElementById('resultModalTitle').innerText = `¡GANADOR (${prizeName.toUpperCase()})!`;
    document.getElementById('resultVal').innerText = val;
    document.getElementById('resultOverlay').classList.add('active');
    currentOnCloseCallback = onClose;
}

function closeResult() {
    document.getElementById('resultOverlay').classList.remove('active');
    if (currentOnCloseCallback) { currentOnCloseCallback(); currentOnCloseCallback = null; }
}

// --- SELECCIÓN DE PREMIO DESDE EL LISTADO LATERAL ---
function selectPrizeFromList(prizeName) {
    const selectElem = document.getElementById('currentPrizeSelect');
    selectElem.value = prizeName;
    updateSelectedPrizeHighlight();
    playBeep(600, 'sine', 0.08); // Pequeño aviso sonoro de cambio de premio
}

function updateSelectedPrizeHighlight() {
    const selectedVal = document.getElementById('currentPrizeSelect').value;
    const items = document.querySelectorAll('#prizesListContainer li');
    items.forEach(li => {
        if (li.getAttribute('data-prize') === selectedVal) {
            li.classList.add('prize-highlight');
        } else {
            li.classList.remove('prize-highlight');
        }
    });
}

// --- TÓMBOLA DE CANICAS ---
const tCanvas = document.getElementById('tombolaCanvas');
const tCtx = tCanvas.getContext('2d');
const centerX = 170, centerY = 170, radiusDome = 150;
let balls = [];
let tombolaHistory = JSON.parse(localStorage.getItem('cat_tombola_history')) || [];
let tSpinning = false, spinTimer = 0, selectedBallIndex = -1, rotationForce = 0;

class Marble {
    constructor(num, color) {
        this.num = num; this.color = color; this.r = 10;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (radiusDome - 40);
        this.x = centerX + Math.cos(angle) * dist;
        this.y = centerY + Math.sin(angle) * dist;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
    }
    update(force) {
        this.vy += 0.25;
        if (force > 0) {
            const dx = this.x - centerX, dy = this.y - centerY;
            this.vx += -dy * 0.008 * force + (Math.random() - 0.5) * force * 1.5;
            this.vy += dx * 0.008 * force + (Math.random() - 0.5) * force * 1.5;
        }
        this.vx *= 0.985; this.vy *= 0.985;
        this.x += this.vx; this.y += this.vy;
        const dx = this.x - centerX, dy = this.y - centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        if (distFromCenter + this.r > radiusDome) {
            const nx = dx / distFromCenter, ny = dy / distFromCenter;
            this.x = centerX + nx * (radiusDome - this.r);
            this.y = centerY + ny * (radiusDome - this.r);
            const dot = this.vx * nx + this.vy * ny;
            this.vx = (this.vx - 2 * dot * nx) * 0.75;
            this.vy = (this.vy - 2 * dot * ny) * 0.75;
        }
    }
    draw() {
        tCtx.save();
        tCtx.beginPath();
        tCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        tCtx.fillStyle = this.color; tCtx.shadowColor = this.color; tCtx.shadowBlur = 8;
        tCtx.fill();
        const grad = tCtx.createRadialGradient(this.x - this.r * 0.3, this.y - this.r * 0.3, 1, this.x, this.y, this.r);
        grad.addColorStop(0, 'rgba(255,255,255,0.9)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0.6)');
        tCtx.beginPath(); tCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        tCtx.fillStyle = grad; tCtx.fill();
        tCtx.fillStyle = '#000'; tCtx.font = 'bold 8px Arial';
        tCtx.textAlign = 'center'; tCtx.textBaseline = 'middle';
        tCtx.fillText(this.num, this.x, this.y + 0.5);
        tCtx.restore();
    }
}

function handleMarbleCollisions() {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            let b1 = balls[i], b2 = balls[j];
            let dx = b2.x - b1.x, dy = b2.y - b1.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let minDist = b1.r + b2.r;
            if (dist < minDist) {
                let nx = dx / (dist || 1), ny = dy / (dist || 1);
                let overlap = minDist - dist;
                b1.x -= nx * overlap * 0.5; b1.y -= ny * overlap * 0.5;
                b2.x += nx * overlap * 0.5; b2.y += ny * overlap * 0.5;
                let kx = b1.vx - b2.vx, ky = b1.vy - b2.vy;
                let p = 2 * (nx * kx + ny * ky) / 2;
                b1.vx -= p * nx * 0.8; b1.vy -= p * ny * 0.8;
                b2.vx += p * nx * 0.8; b2.vy += p * ny * 0.8;
            }
        }
    }
}

function initTombolaState() {
    const savedBalls = localStorage.getItem('cat_tombola_balls');
    const palette = ['#00f3ff', '#ff007f', '#ffe600', '#00ff88', '#9d00ff'];

    if (savedBalls) {
        let nums = JSON.parse(savedBalls);
        balls = nums.map((numStr, i) => new Marble(numStr, palette[i % palette.length]));
    } else {
        balls = [];
        for(let i = 1; i <= 100; i++) {
            let numStr = i < 10 ? '0' + i : i.toString();
            balls.push(new Marble(numStr, palette[i % palette.length]));
        }
        saveTombolaState();
    }
    updateTombolaCounter();
    renderTombolaHistory();
    updateSelectedPrizeHighlight();
}

function saveTombolaState() {
    localStorage.setItem('cat_tombola_balls', JSON.stringify(balls.map(b => b.num)));
    localStorage.setItem('cat_tombola_history', JSON.stringify(tombolaHistory));
}

function resetTombola() {
    if(confirm("¿Restablecer la tómbola a los 100 números y limpiar historial?")) {
        localStorage.removeItem('cat_tombola_balls');
        localStorage.removeItem('cat_tombola_history');
        tombolaHistory = [];
        initTombolaState();
        document.getElementById('btnTombola').disabled = false;
    }
}

function updateTombolaCounter() {
    document.getElementById('tombolaCounter').innerText = `RESTANTES: ${balls.length} CANICAS`;
}

function renderTombolaHistory() {
    const list = document.getElementById('tombolaHistoryList');
    if (tombolaHistory.length === 0) {
        list.innerHTML = `<li class="empty-history">Sin ganadores aún</li>`;
        return;
    }
    list.innerHTML = tombolaHistory.map((item, idx) => `
        <li class="history-item">
            <span style="color:var(--neon-blue); font-size:0.72rem;">🎁 ${item.prize}</span>
            <div style="display:flex; justify-content:space-between; width:100%;">
                <span>#${tombolaHistory.length - idx}</span>
                <strong style="color:var(--neon-gold)">Nº ${item.num}</strong>
            </div>
        </li>
    `).join('');
}

function animateTombola() {
    tCtx.clearRect(0, 0, 340, 340);
    if (tSpinning) {
        spinTimer--;
        rotationForce = spinTimer > 60 ? 3.5 : (spinTimer / 60) * 3.5;
        if(spinTimer % 15 === 0) playBeep(320, 'sine', 0.04);

        if (spinTimer <= 0) {
            tSpinning = false; rotationForce = 0;
            const winningMarble = balls[selectedBallIndex];
            const winnerNum = winningMarble.num;
            const currentPrize = document.getElementById('currentPrizeSelect').value;

            showWinner(`Nº ${winnerNum}`, currentPrize, () => {
                balls.splice(selectedBallIndex, 1);
                tombolaHistory.unshift({ num: winnerNum, prize: currentPrize });
                saveTombolaState();
                updateTombolaCounter();
                renderTombolaHistory();
                if (balls.length > 0) document.getElementById('btnTombola').disabled = false;
                else alert("¡Se extrajeron todas las canicas!");
            });
        }
    }
    balls.forEach(b => b.update(rotationForce));
    handleMarbleCollisions();
    balls.forEach(b => b.draw());
    requestAnimationFrame(animateTombola);
}

function spinTombola() {
    if(tSpinning || balls.length === 0) return;
    selectedBallIndex = Math.floor(Math.random() * balls.length);
    tSpinning = true; spinTimer = 180;
    document.getElementById('btnTombola').disabled = true;
}

initTombolaState();
animateTombola();

// --- RULETA FELINA ---
const wCanvas = document.getElementById('wheelCanvas');
const wCtx = wCanvas.getContext('2d');
let options = [];
let rouletteHistory = JSON.parse(localStorage.getItem('cat_roulette_history')) || [];
let palette = ["#ff007f", "#140c2b", "#00f3ff", "#140c2b", "#ffe600", "#140c2b", "#9d00ff", "#140c2b", "#00ff88"];
let startAngle = 0, arc = 0, spinTimeout = null, spinArcStart = 10, spinTime = 0, spinTimeTotal = 0;

const DEFAULT_CATS = [
    "🐾 Yui", "🐾 Keira", "🐾 Kuro", "🐾 Siorette", 
    "🐾 Rini", "🐾 Milla", "🐾 Minerva", "🐾 Damamaris (Dami)", "🐾 Beyonce (Beyons)"
];

function toggleRouletteMode() {
    const mode = document.getElementById('rouletteMode').value;
    document.getElementById('rouletteTextContainer').style.display = (mode === 'text') ? 'flex' : 'none';
    resetRoulette(false);
}

function initRouletteState() {
    const mode = document.getElementById('rouletteMode').value;
    const savedOptions = localStorage.getItem('cat_roulette_options');

    if (savedOptions) {
        options = JSON.parse(savedOptions);
    } else {
        if (mode === 'cats') {
            options = [...DEFAULT_CATS];
        } else if (mode === 'numbers') {
            options = [];
            for (let i = 1; i <= 100; i++) options.push(`Nº ${i < 10 ? '0' + i : i}`);
        } else {
            const rawInput = document.getElementById('rouletteNames').value;
            options = rawInput.split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
        saveRouletteState();
    }
    document.getElementById('btnRoulette').disabled = (options.length === 0);
    updateRouletteCounter();
    renderRouletteHistory();
    recalcArc();
    drawRoulette();
}

function saveRouletteState() {
    localStorage.setItem('cat_roulette_options', JSON.stringify(options));
    localStorage.setItem('cat_roulette_history', JSON.stringify(rouletteHistory));
}

function resetRoulette(ask = true) {
    if(!ask || confirm("¿Restablecer ruleta a su estado inicial y limpiar historial?")) {
        localStorage.removeItem('cat_roulette_options');
        localStorage.removeItem('cat_roulette_history');
        rouletteHistory = [];
        initRouletteState();
    }
}

function recalcArc() { arc = options.length > 0 ? Math.PI / (options.length / 2) : 0; }
function updateRouletteCounter() { document.getElementById('rouletteCounter').innerText = `OPCIONES RESTANTES: ${options.length}`; }

function renderRouletteHistory() {
    const list = document.getElementById('rouletteHistoryList');
    if (rouletteHistory.length === 0) {
        list.innerHTML = `<li class="empty-history">Sin ganadores aún</li>`;
        return;
    }
    list.innerHTML = rouletteHistory.map((item, idx) => `
        <li class="history-item">
            <div style="display:flex; justify-content:space-between; width:100%;">
                <span>#${rouletteHistory.length - idx}</span>
                <strong style="color:var(--neon-gold)">${item}</strong>
            </div>
        </li>
    `).join('');
}

function drawRoulette() {
    wCtx.clearRect(0, 0, 340, 340);
    if(options.length === 0) return;
    for(let i = 0; i < options.length; i++) {
        let angle = startAngle + i * arc;
        wCtx.fillStyle = palette[i % palette.length];
        wCtx.beginPath();
        wCtx.arc(170, 170, 145, angle, angle + arc, false);
        wCtx.arc(170, 170, 20, angle + arc, angle, true);
        wCtx.fill();
        wCtx.strokeStyle = "rgba(255, 0, 127, 0.6)"; wCtx.lineWidth = 2; wCtx.stroke();

        wCtx.save();
        wCtx.fillStyle = "#fff"; wCtx.font = "bold 11px Arial";
        wCtx.translate(170 + Math.cos(angle + arc / 2) * 95, 170 + Math.sin(angle + arc / 2) * 95);
        wCtx.rotate(angle + arc / 2 + Math.PI / 2);
        let text = options[i].length > 13 ? options[i].substring(0, 11) + '..' : options[i];
        wCtx.fillText(text, -wCtx.measureText(text).width / 2, 0);
        wCtx.restore();
    }
}

function rotateWheel() {
    spinTime += 30;
    if(spinTime % 90 === 0) playBeep(480, 'sine', 0.04);

    if(spinTime >= spinTimeTotal) {
        clearTimeout(spinTimeout);
        let degrees = startAngle * 180 / Math.PI + 90;
        let arcd = arc * 180 / Math.PI;
        let index = Math.floor((360 - degrees % 360) / arcd);
        index = (index % options.length + options.length) % options.length;
        const winnerOption = options[index];

        showWinner(winnerOption, "Ruleta Felina", () => {
            options.splice(index, 1);
            rouletteHistory.unshift(winnerOption);
            saveRouletteState();
            updateRouletteCounter();
            renderRouletteHistory();
            recalcArc();
            drawRoulette();

            if (options.length > 0) document.getElementById('btnRoulette').disabled = false;
            else alert("¡Se sortearon todas las opciones de la ruleta!");
        });
        return;
    }
    let spinAngle = spinArcStart - (spinTime / spinTimeTotal * spinArcStart);
    startAngle += (spinAngle * Math.PI / 180);
    drawRoulette();
    spinTimeout = setTimeout(rotateWheel, 30);
}

function spinWheel() {
    if(options.length === 0) return;
    document.getElementById('btnRoulette').disabled = true;
    spinArcStart = Math.random() * 10 + 10;
    spinTime = 0; spinTimeTotal = Math.random() * 3000 + 4000;
    rotateWheel();
}

initRouletteState();
