const gardenWorld = document.querySelector(".garden-world");
const bubbleLayer = document.querySelector("#bubble-layer");
const bubbleColors = ["#f5c2dc72", "#d0c4f18a", "#b8e3e28c", "#ffe4ac88", "#d4e4ff91"];
const bubbles = [];
let bubbleSounds = false;
let bubbleAudio;

function playBubbleSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!bubbleSounds || !AudioContextClass) return;
    bubbleAudio ??= new AudioContextClass();
    bubbleAudio.resume();
    const oscillator = bubbleAudio.createOscillator();
    const gain = bubbleAudio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(620 + Math.random() * 300, bubbleAudio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(280, bubbleAudio.currentTime + 0.13);
    gain.gain.setValueAtTime(0.055, bubbleAudio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, bubbleAudio.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(bubbleAudio.destination);
    oscillator.start();
    oscillator.stop(bubbleAudio.currentTime + 0.17);
}

function makeParticles(x, y, color) {
    for (let index = 0; index < 7; index += 1) {
        const particle = document.createElement("span");
        const angle = (Math.PI * 2 * index) / 7;
        const distance = 15 + Math.random() * 24;
        particle.className = "bubble-particle";
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.background = color;
        particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        bubbleLayer.append(particle);
        particle.addEventListener("animationend", () => particle.remove(), { once: true });
    }
}

function popBubble(bubble) {
    if (bubble.popping) return;
    bubble.popping = true;
    const bounds = bubble.element.getBoundingClientRect();
    const worldBounds = gardenWorld.getBoundingClientRect();
    makeParticles(bounds.left - worldBounds.left + bounds.width / 2, bounds.top - worldBounds.top + bounds.height / 2, bubble.color);
    bubble.element.classList.add("is-popping");
    playBubbleSound();
    bubble.element.addEventListener("animationend", () => {
        bubble.element.remove();
        const index = bubbles.indexOf(bubble);
        if (index >= 0) bubbles.splice(index, 1);
    }, { once: true });
}

function addBubble(x, y, size) {
    const worldBounds = gardenWorld.getBoundingClientRect();
    const diameter = size ?? 30 + Math.random() * 43;
    const bubble = {
        x: x ?? 24 + Math.random() * Math.max(1, worldBounds.width - 48),
        y: y ?? 30 + Math.random() * Math.max(1, worldBounds.height * 0.62),
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(0.12 + Math.random() * 0.3),
        size: diameter,
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
        element: document.createElement("div"),
        dragging: false,
        popping: false
    };
    const element = bubble.element;
    element.className = "bubble";
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", "Pop or drag this floating bubble");
    element.style.width = `${diameter}px`;
    element.style.height = `${diameter}px`;
    element.style.setProperty("--bubble-color", bubble.color);
    element.style.left = `${bubble.x}px`;
    element.style.top = `${bubble.y}px`;

    let pointerStart = null;
    element.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        element.setPointerCapture(event.pointerId);
        bubble.dragging = true;
        bubble.vx = 0;
        bubble.vy = 0;
        pointerStart = { x: event.clientX, y: event.clientY, bubbleX: bubble.x, bubbleY: bubble.y };
        element.classList.add("is-dragging");
    });
    element.addEventListener("pointermove", (event) => {
        if (!bubble.dragging || !pointerStart) return;
        const bounds = gardenWorld.getBoundingClientRect();
        bubble.x = Math.max(diameter / 2, Math.min(bounds.width - diameter / 2, pointerStart.bubbleX + event.clientX - pointerStart.x));
        bubble.y = Math.max(diameter / 2, Math.min(bounds.height - diameter / 2, pointerStart.bubbleY + event.clientY - pointerStart.y));
        element.style.left = `${bubble.x}px`;
        element.style.top = `${bubble.y}px`;
        const stretch = Math.min(Math.abs(event.clientY - pointerStart.y) / 180, 0.16);
        element.style.transform = `scale(${1 + stretch}, ${1 - stretch})`;
    });
    element.addEventListener("pointerup", (event) => {
        if (!bubble.dragging) return;
        const moved = pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8;
        bubble.dragging = false;
        pointerStart = null;
        element.classList.remove("is-dragging");
        element.style.transform = "";
        if (!moved) popBubble(bubble);
    });
    element.addEventListener("pointercancel", () => {
        bubble.dragging = false;
        pointerStart = null;
        element.classList.remove("is-dragging");
        element.style.transform = "";
    });
    element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            popBubble(bubble);
        }
    });
    bubbleLayer.append(element);
    bubbles.push(bubble);
    return bubble;
}

for (let index = 0; index < 22; index += 1) addBubble();

let previousFrame = performance.now();
function floatBubbles(now) {
    const delta = Math.min((now - previousFrame) / 16.67, 2);
    previousFrame = now;
    const bounds = gardenWorld.getBoundingClientRect();
    bubbles.forEach((bubble) => {
        if (bubble.dragging || bubble.popping) return;
        bubble.x += bubble.vx * delta;
        bubble.y += bubble.vy * delta;
        bubble.vx += (Math.random() - 0.5) * 0.012 * delta;
        bubble.vx = Math.max(-0.4, Math.min(0.4, bubble.vx));
        if (bubble.x < bubble.size / 2 || bubble.x > bounds.width - bubble.size / 2) bubble.vx *= -1;
        if (bubble.y < -bubble.size) {
            bubble.y = bounds.height + bubble.size;
            bubble.x = Math.random() * bounds.width;
        }
        bubble.element.style.left = `${bubble.x}px`;
        bubble.element.style.top = `${bubble.y}px`;
    });
    window.requestAnimationFrame(floatBubbles);
}
window.requestAnimationFrame(floatBubbles);

document.querySelector("#add-bubble").addEventListener("click", () => {
    const bounds = gardenWorld.getBoundingClientRect();
    addBubble(bounds.width * (0.25 + Math.random() * 0.5), bounds.height * (0.2 + Math.random() * 0.45));
});

const bubbleSoundToggle = document.querySelector(".sound-effect-toggle");
bubbleSoundToggle.addEventListener("click", () => {
    bubbleSounds = !bubbleSounds;
    bubbleSoundToggle.setAttribute("aria-pressed", String(bubbleSounds));
    bubbleSoundToggle.setAttribute("aria-label", `Bubble sounds ${bubbleSounds ? "on" : "off"}`);
});

gardenWorld.addEventListener("click", (event) => {
    if (event.target.closest(".bubble, .garden-flower, .garden-mushroom, .garden-tree, .garden-pond, .garden-creature, [data-draggable-cloud]")) return;
    const bounds = gardenWorld.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (y < bounds.height * 0.54) {
        const star = document.createElement("span");
        star.className = "sky-star";
        star.textContent = "✦";
        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        star.style.fontSize = `${14 + Math.random() * 12}px`;
        gardenWorld.append(star);
        star.addEventListener("animationend", () => star.remove(), { once: true });
    } else {
        addBubble(x, y);
    }
});

document.querySelectorAll("[data-draggable-cloud]").forEach((cloud) => {
    let dragStart;
    cloud.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        cloud.setPointerCapture(event.pointerId);
        const cloudBounds = cloud.getBoundingClientRect();
        const worldBounds = gardenWorld.getBoundingClientRect();
        dragStart = {
            x: event.clientX,
            y: event.clientY,
            left: cloudBounds.left - worldBounds.left,
            top: cloudBounds.top - worldBounds.top
        };
        cloud.style.transform = "none";
        cloud.style.left = `${dragStart.left}px`;
        cloud.style.top = `${dragStart.top}px`;
        cloud.style.cursor = "grabbing";
    });
    cloud.addEventListener("pointermove", (event) => {
        if (!dragStart) return;
        const bounds = gardenWorld.getBoundingClientRect();
        cloud.style.left = `${Math.max(-20, Math.min(bounds.width - 90, dragStart.left + event.clientX - dragStart.x))}px`;
        cloud.style.top = `${Math.max(-15, Math.min(bounds.height * 0.55, dragStart.top + event.clientY - dragStart.y))}px`;
    });
    const releaseCloud = () => {
        dragStart = null;
        cloud.style.cursor = "grab";
    };
    cloud.addEventListener("pointerup", releaseCloud);
    cloud.addEventListener("pointercancel", releaseCloud);
});

document.querySelectorAll(".garden-flower").forEach((flower) => {
    flower.addEventListener("click", () => {
        flower.classList.remove("is-blooming");
        window.requestAnimationFrame(() => flower.classList.add("is-blooming"));
    });
});

document.querySelectorAll(".garden-mushroom").forEach((mushroom) => {
    mushroom.addEventListener("click", () => {
        mushroom.classList.remove("is-bouncing");
        window.requestAnimationFrame(() => mushroom.classList.add("is-bouncing"));
        mushroom.addEventListener("animationend", () => mushroom.classList.remove("is-bouncing"), { once: true });
    });
});

const tree = document.querySelector(".garden-tree");
function swayTree() {
    tree.classList.remove("is-swaying");
    window.requestAnimationFrame(() => tree.classList.add("is-swaying"));
    tree.addEventListener("animationend", () => tree.classList.remove("is-swaying"), { once: true });
}
tree.addEventListener("click", swayTree);
tree.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        swayTree();
    }
});

const pond = document.querySelector(".garden-pond");
function makeRipple(event) {
    const bounds = pond.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "pond-ripple";
    ripple.style.left = `${event.clientX - bounds.left}px`;
    ripple.style.top = `${event.clientY - bounds.top}px`;
    pond.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}
pond.addEventListener("click", makeRipple);
pond.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const bounds = pond.getBoundingClientRect();
        makeRipple({ clientX: bounds.left + bounds.width / 2, clientY: bounds.top + bounds.height / 2 });
    }
});

document.querySelectorAll(".garden-creature").forEach((creature) => {
    const greet = () => {
        creature.classList.remove("is-delighted");
        window.requestAnimationFrame(() => creature.classList.add("is-delighted"));
    };
    creature.addEventListener("click", greet);
    creature.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            greet();
        }
    });
});

const clay = document.querySelector("#cloud-clay-object");
let clayStart;
clay.addEventListener("pointerdown", (event) => {
    clay.setPointerCapture(event.pointerId);
    clayStart = { x: event.clientX, y: event.clientY };
    clay.classList.remove("is-bouncing", "is-returning");
    clay.style.animation = "none";
});
clay.addEventListener("pointermove", (event) => {
    if (!clayStart) return;
    const dx = event.clientX - clayStart.x;
    const dy = event.clientY - clayStart.y;
    const stretchX = 1 + Math.min(Math.abs(dx) / 180, 0.55);
    const stretchY = 1 + Math.min(Math.abs(dy) / 180, 0.4);
    clay.style.transform = `translate(${dx * 0.22}px, ${dy * 0.18}px) scale(${stretchX}, ${stretchY}) rotate(${dx * 0.08}deg)`;
    clay.style.borderRadius = `${50 + Math.min(dx / 5, 15)}% ${50 - Math.min(dx / 5, 15)}% ${50 - Math.min(dy / 5, 15)}% ${50 + Math.min(dy / 5, 15)}% / 50%`;
});
function releaseClay(event) {
    if (!clayStart) return;
    const moved = Math.hypot(event.clientX - clayStart.x, event.clientY - clayStart.y) > 6;
    clayStart = null;
    clay.style.transform = "";
    clay.style.borderRadius = "";
    clay.style.animation = "";
    if (!moved) {
        clay.classList.remove("is-bouncing");
        window.requestAnimationFrame(() => clay.classList.add("is-bouncing"));
    } else {
        clay.classList.add("is-returning");
        clay.addEventListener("animationend", () => clay.classList.remove("is-returning"), { once: true });
    }
}
clay.addEventListener("pointerup", releaseClay);
clay.addEventListener("pointercancel", releaseClay);
clay.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        clay.classList.remove("is-bouncing");
        window.requestAnimationFrame(() => clay.classList.add("is-bouncing"));
    }
});

document.querySelectorAll(".color-choice").forEach((choice) => {
    choice.addEventListener("click", () => {
        clay.style.setProperty("--clay-color", choice.dataset.color);
        document.querySelectorAll(".color-choice").forEach((item) => {
            const selected = item === choice;
            item.classList.toggle("is-selected", selected);
            item.setAttribute("aria-pressed", String(selected));
        });
    });
});

const releaseForm = document.querySelector("#release-form");
const releaseInput = document.querySelector("#release-thought");
const releaseMessage = document.querySelector("#release-message");
releaseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const thought = releaseInput.value.trim();
    const star = document.createElement("span");
    star.className = "release-star";
    star.setAttribute("aria-hidden", "true");
    star.textContent = `✦${thought ? ` ${thought}` : ""}`;
    star.style.left = `${gardenWorld.clientWidth * (0.42 + Math.random() * 0.16)}px`;
    star.style.top = `${gardenWorld.clientHeight * 0.76}px`;
    star.style.fontSize = thought ? "clamp(15px, 2vw, 21px)" : "38px";
    gardenWorld.append(star);
    star.addEventListener("animationend", () => star.remove(), { once: true });
    releaseInput.value = "";
    releaseMessage.textContent = "You don't have to solve everything tonight.";
});

const ambientButtons = document.querySelectorAll(".sound-toggle");
let ambientContext;
let ambientNodes = [];
ambientButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const enabled = button.getAttribute("aria-pressed") !== "true";
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (enabled && !AudioContextClass) {
            button.setAttribute("aria-label", "Ambient sound is unavailable in this browser");
            button.querySelector(".sound-label").textContent = "SOUND UNAVAILABLE";
            return;
        }
        if (enabled) {
            ambientContext ??= new AudioContextClass();
            ambientContext.resume();
            ambientNodes = [174.61, 261.63].map((frequency, index) => {
                const oscillator = ambientContext.createOscillator();
                const gain = ambientContext.createGain();
                oscillator.type = "sine";
                oscillator.frequency.value = frequency;
                gain.gain.value = index === 0 ? 0.012 : 0.007;
                oscillator.connect(gain);
                gain.connect(ambientContext.destination);
                oscillator.start();
                return { oscillator, gain };
            });
        } else {
            ambientNodes.forEach(({ oscillator, gain }) => {
                gain.gain.setTargetAtTime(0, ambientContext.currentTime, 0.25);
                window.setTimeout(() => oscillator.stop(), 1100);
            });
            ambientNodes = [];
        }
        ambientButtons.forEach((item) => {
            item.setAttribute("aria-pressed", String(enabled));
            item.setAttribute("aria-label", `Turn ambient sound ${enabled ? "off" : "on"}`);
            item.querySelector(".sound-label").textContent = enabled ? "SOUND ON" : "SOUND OFF";
        });
    });
});
