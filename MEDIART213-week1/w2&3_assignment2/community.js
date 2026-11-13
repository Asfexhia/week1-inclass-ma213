const seedForm = document.querySelector("#seed-form");
const seedToggle = document.querySelector("#toggle-seed-form");
const seedTitle = document.querySelector("#seed-title");
const seedNote = document.querySelector("#seed-note");
const seedList = document.querySelector("#seed-list");
const communityStatus = document.querySelector("#community-status");

function announce(message) {
    communityStatus.textContent = message;
}

seedToggle.addEventListener("click", () => {
    const opening = seedForm.hidden;
    seedForm.hidden = !opening;
    seedToggle.setAttribute("aria-expanded", String(opening));
    if (opening) seedTitle.focus();
});

document.querySelector("#cancel-seed-form").addEventListener("click", () => {
    seedForm.reset();
    seedForm.hidden = true;
    seedToggle.setAttribute("aria-expanded", "false");
    seedToggle.focus();
});

seedForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = seedTitle.value.trim();
    const note = seedNote.value.trim();
    if (!title) {
        seedTitle.focus();
        return;
    }

    const card = document.createElement("article");
    card.className = "idea-card";
    const flower = document.createElement("span");
    flower.className = "idea-flower flower-daisy";
    flower.setAttribute("aria-hidden", "true");
    flower.textContent = "✿";

    const copy = document.createElement("div");
    copy.className = "idea-copy";
    const byline = document.createElement("p");
    byline.className = "idea-byline";
    byline.textContent = "A new seed from you";
    const heading = document.createElement("h4");
    heading.textContent = title;
    const description = document.createElement("p");
    description.textContent = note || "A small idea, ready to grow with a little care.";
    copy.append(byline, heading, description);

    const waterButton = document.createElement("button");
    waterButton.className = "water-button";
    waterButton.type = "button";
    waterButton.setAttribute("aria-label", `Water your idea: ${title}`);
    waterButton.innerHTML = "<span aria-hidden=\"true\"></span> Water this idea";
    card.append(flower, copy, waterButton);
    seedList.prepend(card);
    seedForm.reset();
    seedForm.hidden = true;
    seedToggle.setAttribute("aria-expanded", "false");
    announce("Your idea is planted. It can grow at its own pace.");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
});

seedList.addEventListener("click", (event) => {
    const button = event.target.closest(".water-button");
    if (!button || button.classList.contains("is-watered")) return;
    button.classList.add("is-watered");
    button.disabled = true;
    button.innerHTML = "<span aria-hidden=\"true\">✿</span> Watered with care";
    announce("A little care was shared. No score, just support.");
});

document.querySelectorAll(".join-button").forEach((button) => {
    button.addEventListener("click", () => {
        const joined = button.getAttribute("aria-pressed") !== "true";
        button.setAttribute("aria-pressed", String(joined));
        button.innerHTML = joined
            ? "You're in <span aria-hidden=\"true\">✿</span>"
            : "Join this circle <span aria-hidden=\"true\">↗</span>";
        const circle = button.closest(".circle-card-item").querySelector("h4").textContent;
        announce(joined ? `Welcome to ${circle}. Come as you are.` : `You've left ${circle}. The door stays open.`);
    });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = document.querySelectorAll(".manifesto, .community-section .section-heading, .community-card, .shared-seeds, .circles, .garden-door, .places");
if ("IntersectionObserver" in window) {
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

if (!reducedMotion) {
    const heroCopy = document.querySelector(".hero-copy");
    let ticking = false;
    const updateHero = () => {
        const progress = Math.min(window.scrollY / (window.innerHeight * 0.62), 1);
        heroCopy.style.setProperty("--hero-opacity", String(1 - progress));
        heroCopy.style.setProperty("--hero-shift", `${progress * -24}px`);
        ticking = false;
    };
    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHero);
            ticking = true;
        }
    }, { passive: true });

    const community = document.querySelector(".community-section");
    community.addEventListener("pointermove", (event) => {
        const bounds = community.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        community.style.setProperty("--drift-x", `${x * 18}px`);
        community.style.setProperty("--drift-y", `${y * 14}px`);
    });
    community.addEventListener("pointerleave", () => {
        community.style.setProperty("--drift-x", "0px");
        community.style.setProperty("--drift-y", "0px");
    });
}
