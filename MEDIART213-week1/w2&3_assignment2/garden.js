const flowerTypes = {
    daisy: "daisy",
    cosmos: "cosmos",
    tulip: "tulip",
    moonflower: "moonflower"
};
const flowerChoice = document.querySelector("#flower-choice");
const personalGarden = document.querySelector("#personal-garden");
const gardenMessage = document.querySelector("#garden-message");
let flowers = [];

function say(message) {
    gardenMessage.textContent = message;
}

function saveGarden() {
    try {
        localStorage.setItem("listening-commons-garden", JSON.stringify(flowers));
    } catch {
        say("Your garden is growing for this visit, but this browser couldn't save it.");
    }
}

function renderGarden() {
    personalGarden.querySelectorAll(".grown-flower").forEach((flower) => flower.remove());
    flowers.forEach((flower) => {
        const plant = document.createElement("div");
        plant.className = "grown-flower";
        plant.dataset.type = flower.type;
        plant.dataset.growth = String(flower.growth);
        plant.setAttribute("role", "img");
        plant.setAttribute("aria-label", `${flower.type} flower, growth stage ${flower.growth + 1}`);
        const stem = document.createElement("span");
        stem.className = "grown-stem";
        const head = document.createElement("span");
        head.className = "grown-head";
        plant.append(stem, head);
        personalGarden.insertBefore(plant, personalGarden.querySelector(".soil"));
    });
    personalGarden.classList.toggle("has-flowers", flowers.length > 0);
}

function loadGarden() {
    try {
        const saved = localStorage.getItem("listening-commons-garden");
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.some((flower) =>
            !flower || !Object.hasOwn(flowerTypes, flower.type) ||
            !Number.isInteger(flower.growth) || flower.growth < 0 || flower.growth > 3
        )) {
            throw new Error("Saved garden data is not valid.");
        }
        flowers = parsed;
        if (flowers.length) say("Welcome back. Your garden is waiting for you.");
    } catch {
        say("Your saved garden couldn't be read. You can start a fresh patch here.");
    }
}

document.querySelector("#plant-flower").addEventListener("click", () => {
    const type = flowerChoice.value;
    if (!Object.hasOwn(flowerTypes, type)) {
        say("Choose a flower before planting.");
        return;
    }
    flowers.push({ id: `${Date.now()}-${Math.random()}`, type, growth: 0 });
    renderGarden();
    saveGarden();
    say(`A ${type} seed is in the soil. Give it a little water when you're ready.`);
});

document.querySelector("#water-garden").addEventListener("click", () => {
    if (!flowers.length) {
        say("Your patch is ready. Plant a seed before watering.");
        return;
    }
    const growing = flowers.filter((flower) => flower.growth < 3);
    if (!growing.length) {
        say("Everything is blooming. Let your garden enjoy the sunshine.");
        return;
    }
    growing.forEach((flower) => { flower.growth += 1; });
    renderGarden();
    saveGarden();
    personalGarden.classList.remove("is-watering");
    window.requestAnimationFrame(() => personalGarden.classList.add("is-watering"));
    say("A gentle rain. Your flowers stretch toward the light.");
    window.setTimeout(() => personalGarden.classList.remove("is-watering"), 750);
});

document.querySelector("#exchange-seed").addEventListener("click", () => {
    const offered = flowerChoice.value;
    const neighbors = Object.keys(flowerTypes).filter((type) => type !== offered);
    const received = neighbors[Math.floor(Math.random() * neighbors.length)];
    flowerChoice.value = received;
    say(`You shared a ${offered} seed with a neighbor and received a ${received} seed in return. It's ready to plant.`);
});

loadGarden();
renderGarden();

if ("IntersectionObserver" in window) {
    const revealTargets = document.querySelectorAll(".garden-workshop, .path-section, .garden-pause, .garden-footer-note");
    revealTargets.forEach((element) => element.setAttribute("data-reveal", ""));
    document.body.classList.add("motion-ready");
    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    revealTargets.forEach((element) => observer.observe(element));
}
