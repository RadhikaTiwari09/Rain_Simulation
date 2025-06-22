const canvas = document.getElementById('rainCanvas');
const ctx = canvas.getContext('2d');
const rainIntensitySlider = document.getElementById('rainIntensity');
const intensityValue = document.getElementById('intensityValue');
const windStrengthSlider = document.getElementById('windStrength');
const windStrengthValue = document.getElementById('windStrengthValue');
const windDirectionSlider = document.getElementById('windDirection');
const windDirectionValue = document.getElementById('windDirectionValue');
const rainColorPicker = document.getElementById('rainColor');
const soundToggle = document.getElementById('soundToggle');
const lightningToggle = document.getElementById('lightningToggle');
const splashToggle = document.getElementById('splashToggle');
const particleToggle = document.getElementById('particleToggle');
const dayNightToggle = document.getElementById('dayNightToggle');
const backgroundToggle = document.getElementById('backgroundToggle');
const saveSettingsBtn = document.getElementById('saveSettings');
const loadSettingsBtn = document.getElementById('loadSettings');
const rainSound = document.getElementById('rainSound');
const thunderSound = document.getElementById('thunderSound');
const bgUploadInput = document.getElementById('bgUpload');
const revertBgBtn = document.getElementById('revertBg');
const toggleBtn = document.getElementById("toggleControls");
const controlsPanel = document.querySelector(".controls");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let raindrops = [];
let splashes = [];
let ripples = [];
let puddles = [];
let particles = [];
let wind = 0;
let lightningOpacity = 0;
let backgroundOpacity = 1;
let lightningTimer = 0;
let lightningFlashes = [];
let timeOfDay = 0;
let backgroundImage = new Image();
let hasInteracted = false;
const defaultBgSrc = 'assets/images/bg.jpg';
let isCustomBg = localStorage.getItem('isCustomBg') === 'true'
if (isCustomBg) {
  let temp = localStorage.getItem('customBgImage')
  if (temp) backgroundImage.src = temp
  else backgroundImage.src = defaultBgSrc
}
else backgroundImage.src = defaultBgSrc

toggleBtn.addEventListener("click", function () {
  if (controlsPanel.classList.contains("hidden")) {
    controlsPanel.classList.remove("hidden")
    toggleBtn.textContent = "Hide Controls"
  }
  else {
    controlsPanel.classList.add("hidden")
    toggleBtn.textContent = "Show Controls"
  }
})

bgUploadInput.addEventListener('change', () => {
  const file = bgUploadInput.files[0];
  if (!file || !file.type.startsWith('image/')) {
    alert('Please upload a valid image file.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      localStorage.setItem('customBgImage', reader.result);
      localStorage.setItem('isCustomBg', 'true');
      isCustomBg = true;
      backgroundImage.src = reader.result;
    };
    img.onerror = () => {
      alert('Failed to load image. Reverting to default background.');
      revertToDefaultBg();
    };
    img.src = reader.result;
  };
  reader.onerror = () => alert('Error reading file.');
  reader.readAsDataURL(file);
});

function revertToDefaultBg() {
  localStorage.removeItem('customBgImage');
  localStorage.setItem('isCustomBg', 'false');
  isCustomBg = false;
  backgroundImage.src = defaultBgSrc;
}

revertBgBtn.addEventListener('click', revertToDefaultBg);

backgroundImage.onerror = () => {
  isCustomBg = false;
  backgroundImage.src = defaultBgSrc;
};

function initializeSound() {
  if (soundToggle.checked == true && rainSound.paused == true && (hasInteracted == true || hasInteracted == false)) {
    rainSound.volume = Math.min(rainIntensitySlider.value / 150, 0.8);
  }
  else if (soundToggle.checked == false) rainSound.pause();
}

document.addEventListener('pointerdown', function () {
  if (hasInteracted == false) {
    hasInteracted = true;
    initializeSound();
  }
}, { once: true });

class Raindrop {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * -canvas.height * 1.5;
    this.length = Math.random() * 25 + 15 * (rainIntensitySlider.value / 100);
    this.speed = Math.random() * 8 + 8 * (rainIntensitySlider.value / 100);
    this.width = Math.random() * 1.2 + 0.8 * (rainIntensitySlider.value / 100);
    this.angle = Math.random() * 0.15 - 0.075;
    this.opacity = Math.random() * 0.3 + 0.7;
    this.z = Math.random() * 1.5 + 0.5;
    this.trailLength = Math.random() * 5 + 5;
    this.color = rainColorPicker.value;
  }

  update() {
    const gravity = 0.15 * (rainIntensitySlider.value / 50);
    const windAngle = parseFloat(windDirectionSlider.value) * Math.PI / 180;
    const windEffect = parseFloat(windStrengthSlider.value) * Math.cos(windAngle) * 2;
    this.speed = this.speed + gravity / this.z;
    this.y = this.y + this.speed;
    this.x = this.x + windEffect + this.angle * this.z;

    if (this.y > canvas.height + this.length) {
      if (splashToggle.checked == true && Math.random() < 0.8) {
        splashes.push(new Splash(this.x, canvas.height));
        ripples.push(new Ripple(this.x, canvas.height));
        if (Math.random() < 0.1) puddles.push(new Puddle(this.x, canvas.height));
        if (particleToggle.checked == true) particles.push(new Particle(this.x, canvas.height));
      }
      this.reset();
    }
  }

  draw() {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.angle * 10 * this.z, this.y + this.length);
    ctx.strokeStyle = this.color.replace(")", ", " + this.opacity + ")");
    ctx.lineWidth = this.width / this.z;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.angle * 5 * this.z, this.y - this.trailLength);
    ctx.strokeStyle = this.color.replace(")", ", " + (this.opacity * 0.3) + ")");
    ctx.lineWidth = (this.width / this.z) * 0.5;
    ctx.stroke();

    if (this.y > canvas.height * 0.8) {
      ctx.beginPath();
      ctx.moveTo(this.x, canvas.height - (this.y - canvas.height));
      ctx.lineTo(this.x + this.angle * 10 * this.z, canvas.height - (this.y - canvas.height) + this.length * 0.5);
      ctx.strokeStyle = this.color.replace(")", ", " + (this.opacity * 0.2) + ")");
      ctx.lineWidth = (this.width / this.z) * 0.4;
      ctx.stroke();
    }
  }
}


class Splash {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    const count = Math.floor(rainIntensitySlider.value / 30) + 4;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5,
        life: Math.random() * 25 + 20,
        size: Math.random() * 1.8 + 1,
        color: rainColorPicker.value
      });
    }
  }

  update() {
    this.particles.forEach(function (p) {
      p.x = p.x + p.vx;
      p.y = p.y + p.vy;
      p.vy = p.vy + 0.18;
      p.life = p.life - 0.5;
      p.size = p.size * 0.97;
    });

    this.particles = this.particles.filter(function (p) {
      return p.life > 0;
    });
  }

  draw() {
    ctx.beginPath();
    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.size, p.y + p.size);
    }

    if (this.particles.length > 0) ctx.strokeStyle = this.particles[0].color.replace(')', ', 0.6)');
    else ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}


class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = Math.random() * 20 + 15;
    this.speed = Math.random() * 0.5 + 0.4;
    this.opacity = 0.55;
    this.color = rainColorPicker.value;
  }

  update() {
    this.radius = this.radius + this.speed;
    this.opacity = this.opacity - 0.012;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color.replace(")", ", " + this.opacity + ")");
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
}


class Puddle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 10 + 5;
    this.opacity = 0.3;
    this.life = Math.random() * 200 + 100;
  }

  update() {
    this.life = this.life - 0.2;
    this.opacity = this.opacity - 0.001;
    if (this.opacity < 0) this.opacity = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(50, 70, 90, " + this.opacity + ")";
    ctx.fill();
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = -Math.random() * 3;
    this.life = Math.random() * 30 + 20;
    this.size = Math.random() * 2 + 1;
    this.color = rainColorPicker.value;
  }

  update() {
    this.x = this.x + this.vx;
    this.y = this.y + this.vy;
    this.vy = this.vy + 0.1;
    this.life = this.life - 0.5;
    this.size = this.size * 0.98;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color.replace(")", ", 0.7)");
    ctx.fill();
  }
}

function initRaindrops(count) {
  raindrops = [];
  for (let i = 0; i < count; i++) raindrops.push(new Raindrop());
}

function createLightningFlashes() {
  lightningFlashes = [];
  const flashCount = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < flashCount; i++) {
    lightningFlashes.push({
      opacity: Math.random() * 0.5 + 0.4,
      duration: Math.random() * 15 + 10
    });
  }
}

let nextLightningTime = 60 * (5 + Math.random());

function triggerLightning() {
  if (!lightningToggle.checked) return;
  lightningTimer++;
  if (lightningTimer > nextLightningTime && lightningFlashes.length === 0) {
    createLightningFlashes();
    lightningTimer = 0;
    nextLightningTime = 60 * (Math.random() * 4 + 5);
    if (soundToggle.checked) {
      thunderSound.currentTime = 0;
    }
  }
}

function saveSettings() {
  const settings = {
    rainIntensity: rainIntensitySlider.value,
    windStrength: windStrengthSlider.value,
    windDirection: windDirectionSlider.value,
    rainColor: rainColorPicker.value,
    soundToggle: soundToggle.checked,
    lightningToggle: lightningToggle.checked,
    splashToggle: splashToggle.checked,
    particleToggle: particleToggle.checked,
    dayNightToggle: dayNightToggle.checked,
    backgroundToggle: backgroundToggle.checked,
    isCustomBg: isCustomBg
  };

  localStorage.setItem('rainSimulationSettings', JSON.stringify(settings));
  alert('settings saved.');
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('rainSimulationSettings'));

  if (settings != null) {
    rainIntensitySlider.value = settings.rainIntensity;
    intensityValue.textContent = settings.rainIntensity;
    windStrengthSlider.value = settings.windStrength;
    windStrengthValue.textContent = settings.windStrength;
    windDirectionSlider.value = settings.windDirection;
    windDirectionValue.textContent = settings.windDirection;
    rainColorPicker.value = settings.rainColor;
    soundToggle.checked = settings.soundToggle;
    splashToggle.checked = settings.splashToggle;
    particleToggle.checked = settings.particleToggle;
    dayNightToggle.checked = settings.dayNightToggle;
    backgroundToggle.checked = settings.backgroundToggle;

    if (settings.isCustomBg) isCustomBg = settings.isCustomBg;
    else isCustomBg = false;

    localStorage.setItem('isCustomBg', isCustomBg);

    if (isCustomBg) {
      backgroundImage.src = localStorage.getItem('customBgImage');
      if (!backgroundImage.src) backgroundImage.src = defaultBgSrc;
    }
    else backgroundImage.src = defaultBgSrc;

    initRaindrops(settings.rainIntensity);
    initializeSound();
  }
}

function animate() {
  triggerLightning();

  if (dayNightToggle.checked == true) {
    timeOfDay = timeOfDay + 0.0005;
    backgroundOpacity = 0.65 + 0.35 * Math.sin(timeOfDay * Math.PI * 2);
  }
  else backgroundOpacity = Math.min(backgroundOpacity + 0.01, 1);

  if (backgroundToggle.checked == true && backgroundImage.complete == true) {
    ctx.globalAlpha = backgroundOpacity;
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  else {
    ctx.fillStyle = "rgba(26, 38, 51, " + backgroundOpacity + ")";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  puddles.forEach(function (puddle) {
    puddle.update();
    puddle.draw();
  });
  puddles = puddles.filter(function (puddle) {
    return puddle.life > 0;
  });

  raindrops.forEach(function (drop) {
    drop.update();
    drop.draw();
  });

  if (splashToggle.checked == true) {
    splashes.forEach(function (splash) {
      splash.update();
      splash.draw();
    });
    splashes = splashes.filter(function (splash) {
      return splash.particles.length > 0;
    });

    ripples.forEach(function (ripple) {
      ripple.update();
      ripple.draw();
    });
    ripples = ripples.filter(function (ripple) {
      return ripple.opacity > 0;
    });
  }

  if (particleToggle.checked == true) {
    particles.forEach(function (particle) {
      particle.update();
      particle.draw();
    });
    particles = particles.filter(function (particle) {
      return particle.life > 0;
    });
  }

  if (lightningToggle.checked == true && lightningFlashes.length > 0) {
    const currentFlash = lightningFlashes[0];
    lightningOpacity = currentFlash.opacity * (1 + Math.sin(Date.now() * 0.02) * 0.2);
    ctx.fillStyle = "rgba(255, 255, 255, " + lightningOpacity + ")";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    currentFlash.duration = currentFlash.duration - 1;
    if (currentFlash.duration <= 0) lightningFlashes.shift();
  }
  else lightningOpacity = 0;

  wind = parseFloat(windStrengthSlider.value) * Math.sin(Date.now() * 0.0007) * 2;

  requestAnimationFrame(animate);
}

rainIntensitySlider.addEventListener('input', () => {
  intensityValue.textContent = rainIntensitySlider.value;
  initRaindrops(rainIntensitySlider.value);
  if (soundToggle.checked) {
    rainSound.volume = Math.min(rainIntensitySlider.value / 150, 0.8);
  }
});

windStrengthSlider.addEventListener('input', () => {
  windStrengthValue.textContent = windStrengthSlider.value;
});

windDirectionSlider.addEventListener('input', () => {
  windDirectionValue.textContent = `${windDirectionSlider.value}°`;
});

rainColorPicker.addEventListener('input', () => {
  raindrops.forEach(drop => drop.color = rainColorPicker.value);
});

soundToggle.addEventListener('change', () => {
  initializeSound();
});

lightningToggle.addEventListener('change', () => {
  if (!lightningToggle.checked) {
    lightningFlashes = [];
    lightningOpacity = 0;
    lightningTimer = 0;
  }
});

saveSettingsBtn.addEventListener('click', saveSettings);
loadSettingsBtn.addEventListener('click', loadSettings);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initRaindrops(rainIntensitySlider.value);
});

window.addEventListener('DOMContentLoaded', () => {
  initializeSound();
  initRaindrops(rainIntensitySlider.value);
  animate();
});
