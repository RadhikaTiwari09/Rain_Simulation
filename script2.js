const windGustToggle = document.getElementById('windGustToggle');
const rainShadowToggle = document.getElementById('rainShadowToggle');
const cursorEffectToggle = document.getElementById('cursorEffectToggle');
const glowEffectToggle = document.getElementById('glowEffectToggle');
const raindropSizeSlider = document.getElementById('raindropSize');
const raindropSizeValue = document.getElementById('raindropSizeValue');
const lightningImage = document.getElementById('lightningImage');

if (!windGustToggle || !rainShadowToggle || !cursorEffectToggle || !glowEffectToggle) throw new Error('missing control elements');

let windGustTimer = 0;
let windGustStrength = 0;
let cursorPos = { x: canvas.width / 2, y: canvas.height / 2 };
let rainShadows = [
    { x: canvas.width * 0.3, y: canvas.height * 0.7, width: 100, height: 50 },
    { x: canvas.width * 0.6, y: canvas.height * 0.8, width: 80, height: 40 }
];
let currentWindGust = null;

class WindGust {
    constructor() {
        this.strength = Math.random() * 8 + 4;
        this.duration = Math.random() * 60 + 30;
        this.angle = (Math.random() - 0.5) * Math.PI / 2;
    }

    update() {
        this.duration = this.duration - 1;
        if (this.duration > 0) return this.strength * (this.duration / 90);
        else return 0;
    }

    draw() {
        ctx.save();
        ctx.beginPath();

        for (let i = 0; i < 10; i = i + 1) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(this.angle) * 20, y + Math.sin(this.angle) * 20);
        }

        ctx.strokeStyle = "rgba(255, 255, 255, " + (this.duration / 90 * 0.3) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

function updateWindGusts() {
    if (windGustToggle.checked == false) return;

    windGustTimer = windGustTimer + 1;

    if (windGustTimer > Math.random() * 300 + 200 && currentWindGust == null) {
        currentWindGust = new WindGust();
        windGustTimer = 0;
    }

    if (currentWindGust != null) {
        windGustStrength = currentWindGust.update();

        if (windGustToggle.checked == true) currentWindGust.draw();
        if (currentWindGust.duration <= 0) currentWindGust = null;
    }
}

function isInShadow(x, y) {
    if (rainShadowToggle.checked == false) return false;

    for (let i = 0; i < rainShadows.length; i = i + 1) {
        let shadow = rainShadows[i];
        if (x > shadow.x && x < shadow.x + shadow.width && y > shadow.y && y < shadow.y + shadow.height) {
            return true;
        }
    }
    return false;
}

const originalRaindropUpdate = Raindrop.prototype.update;

Raindrop.prototype.update = function () {
    const windAngle = parseFloat(windDirectionSlider.value) * Math.PI / 180 || 0;
    const windEffect = (parseFloat(windStrengthSlider.value) + windGustStrength) * Math.cos(windAngle) * 2;

    if (cursorEffectToggle.checked == true) {
        const dx = this.x - cursorPos.x;
        const dy = this.y - cursorPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150) {
            this.x = this.x + (dx / distance) * 3;
            this.y = this.y + (dy / distance) * 3;
        }
    }

    if (rainShadowToggle.checked == true && isInShadow(this.x, this.y) == true) {
        this.opacity = this.opacity * 0.95;
        this.speed = this.speed * 0.9;
    }

    originalRaindropUpdate.call(this);
};

const originalRaindropDraw = Raindrop.prototype.draw;

Raindrop.prototype.draw = function () {
    if (glowEffectToggle.checked == true && dayNightToggle.checked == true) {
        const glowIntensity = 0.3 * (1 - backgroundOpacity);
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width * 3 / this.z, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(")", ", " + glowIntensity + ")");
        ctx.fill();
        ctx.restore();
    }

    originalRaindropDraw.call(this);
};

const originalAnimate = animate;

animate = function () {
    updateWindGusts();

    if (rainShadowToggle.checked == true) {
        ctx.save();
        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";

        for (let i = 0; i < rainShadows.length; i = i + 1) {
            let shadow = rainShadows[i];
            ctx.fillRect(shadow.x, shadow.y, shadow.width, shadow.height);
        }

        ctx.restore();
    }

    originalAnimate.call(this);
};

canvas.addEventListener('mousemove', function (e) {
    cursorPos.x = e.clientX;
    cursorPos.y = e.clientY;
});

canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    cursorPos.x = e.touches[0].clientX;
    cursorPos.y = e.touches[0].clientY;
});

const originalSaveSettings = saveSettings;
saveSettings = function () {
    originalSaveSettings.call(this);
    const settings = JSON.parse(localStorage.getItem('rainSimulationSettings')) || {};
    settings.windGustToggle = windGustToggle.checked;
    settings.rainShadowToggle = rainShadowToggle.checked;
    settings.cursorEffectToggle = cursorEffectToggle.checked;
    settings.glowEffectToggle = glowEffectToggle.checked;
    localStorage.setItem('rainSimulationSettings', JSON.stringify(settings));
};

const originalLoadSettings = loadSettings;
loadSettings = function () {
    originalLoadSettings.call(this);
    const settings = JSON.parse(localStorage.getItem('rainSimulationSettings'));
    if (settings) {
        windGustToggle.checked = settings.windGustToggle == undefined ? true : settings.windGustToggle;
        rainShadowToggle.checked = settings.rainShadowToggle == undefined ? false : settings.rainShadowToggle;
        cursorEffectToggle.checked = settings.cursorEffectToggle == undefined ? true : settings.cursorEffectToggle;
        glowEffectToggle.checked = settings.glowEffectToggle == undefined ? true : settings.glowEffectToggle;
    }
};

window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    rainShadows = [
        { x: canvas.width * 0.3, y: canvas.height * 0.7, width: 100, height: 50 },
        { x: canvas.width * 0.6, y: canvas.height * 0.8, width: 80, height: 40 }
    ];
    initRaindrops(rainIntensitySlider.value);
});

raindropSizeSlider.addEventListener('input', function () {
    raindropSizeValue.textContent = raindropSizeSlider.value;
});

function applyRaindropSizeScaling() {
    const scale = parseFloat(raindropSizeSlider.value);

    raindrops.forEach(function (drop) {
        if (!drop._originalDraw) drop._originalDraw = drop.draw;

        drop.draw = function () {
            ctx.save();
            ctx.scale(scale, scale);
            ctx.translate(this.x / scale, this.y / scale);
            this._originalDraw();
            ctx.restore();
        };
    });
}

function animateWithSizeScaling() {
    applyRaindropSizeScaling();
    animate();
}

animateWithSizeScaling();

raindropSizeSlider.addEventListener('input', function () {
    raindropSizeValue.textContent = raindropSizeSlider.value;
    applyRaindropSizeScaling();
});

function showLightningImage() {
    lightningImage.style.opacity = 1;
    setTimeout(function () { lightningImage.style.opacity = 0.5; }, 80);
    setTimeout(function () { lightningImage.style.opacity = 1; }, 160);
    setTimeout(function () { lightningImage.style.opacity = 0; }, 300);
}
