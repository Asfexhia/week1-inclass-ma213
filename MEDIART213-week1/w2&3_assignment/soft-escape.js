const starField = document.querySelector("#gateway-stars");
const starCount = 34;

for (let index = 0; index < starCount; index += 1) {
    const star = document.createElement("span");
    star.className = "star-speck";
    star.textContent = index % 4 === 0 ? "✧" : "·";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 76}%`;
    star.style.fontSize = `${7 + Math.random() * 13}px`;
    star.style.setProperty("--duration", `${3 + Math.random() * 4}s`);
    star.style.setProperty("--delay", `${Math.random() * -6}s`);
    starField.append(star);
}

const gateway = document.querySelector(".gateway-hero");
const clouds = gateway.querySelectorAll(".gateway-cloud");
const stars = starField.querySelectorAll(".star-speck");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion) {
    gateway.addEventListener("pointermove", (event) => {
        const bounds = gateway.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        clouds.forEach((cloud, index) => {
            const depth = (index + 1) * 11;
            cloud.style.translate = `${x * depth}px ${y * depth}px`;
        });
        stars.forEach((star, index) => {
            const depth = (index % 5 + 1) * 1.5;
            star.style.translate = `${x * depth}px ${y * depth}px`;
        });
    });

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
            gateway.style.setProperty("--scroll-drift", `${progress * 24}px`);
            gateway.querySelector(".hero-copy").style.opacity = String(1 - progress * 0.4);
            ticking = false;
        });
    }, { passive: true });
}

const ambientButtons = document.querySelectorAll(".sound-toggle");
let audioContext;
let ambientNodes = [];

function stopAmbient() {
    ambientNodes.forEach((node) => {
        node.gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.25);
        window.setTimeout(() => node.oscillator.stop(), 1100);
    });
    ambientNodes = [];
}

ambientButtons.forEach((button) => {
    button.addEventListener("click", () => {
        if (button.getAttribute("aria-pressed") === "true") {
            stopAmbient();
            ambientButtons.forEach((item) => {
                item.setAttribute("aria-pressed", "false");
                item.setAttribute("aria-label", "Turn ambient sound on");
                item.querySelector(".sound-label").textContent = "SOUND OFF";
            });
            return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            button.setAttribute("aria-label", "Ambient sound is unavailable in this browser");
            button.querySelector(".sound-label").textContent = "SOUND UNAVAILABLE";
            return;
        }
        audioContext ??= new AudioContextClass();
        audioContext.resume();
        ambientNodes = [174.61, 261.63].map((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            gain.gain.value = index === 0 ? 0.012 : 0.007;
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start();
            return { oscillator, gain };
        });
        ambientButtons.forEach((item) => {
            item.setAttribute("aria-pressed", "true");
            item.setAttribute("aria-label", "Turn ambient sound off");
            item.querySelector(".sound-label").textContent = "SOUND ON";
        });
    });
});
