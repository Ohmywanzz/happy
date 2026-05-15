const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

if (window.lucide) {
  lucide.createIcons();
}

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const random = (min, max) => gsap.utils.random(min, max);

const state = {
  pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  name: "",
  noteStarted: false,
  audio: null,
  playing: false,
  activeHearts: [],
  customCursor: matchMedia("(pointer: fine)").matches && !prefersReducedMotion
};

if (state.customCursor) {
  document.body.classList.add("has-custom-cursor");
}

function splitLetters(element) {
  const text = element.textContent.trim();
  element.setAttribute("aria-label", text);
  element.innerHTML = "";

  [...text].forEach((char) => {
    const span = document.createElement("span");
    if (char === " ") {
      span.className = "split-space";
      span.innerHTML = "&nbsp;";
    } else {
      span.className = "split-char";
      span.textContent = char;
    }
    element.appendChild(span);
  });
}

function splitWords(element) {
  const text = element.textContent.trim();
  element.setAttribute("aria-label", text);
  element.innerHTML = "";

  text.split(" ").forEach((word, index, words) => {
    const span = document.createElement("span");
    span.className = "split-word";
    span.textContent = word;
    element.appendChild(span);
    if (index < words.length - 1) {
      element.append(" ");
    }
  });
}

qsa(".split-letters").forEach(splitLetters);
qsa(".split-words, .split-surprise").forEach(splitWords);

function updatePersonalText() {
  const safeName = state.name.trim();
  const displayName = safeName || "you";
  qs("#personalGreeting").textContent = safeName
    ? `For ${safeName}, who makes ordinary minutes feel rare.`
    : "For someone unforgettable.";
  qs("#surpriseName").textContent = displayName;

  if (!state.noteStarted) {
    qsa(".typing-line").forEach((line) => {
      line.textContent = "";
    });
  }
}

qs("#nameInput").addEventListener("input", (event) => {
  state.name = event.target.value.replace(/\s+/g, " ").slice(0, 36);
  updatePersonalText();
});

function introTimeline() {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to(".loader__mark span", {
    rotate: (index) => [130, -95, 210][index],
    scale: (index) => [1.1, 0.92, 1.18][index],
    duration: 1.15,
    stagger: 0.06,
    ease: "sine.inOut"
  })
    .to(".loader__track span", { scaleX: 1, duration: 0.9 }, 0.12)
    .to(".loader", { autoAlpha: 0, filter: "blur(18px)", duration: 0.85 }, ">-0.12")
    .fromTo(
      ".gradient-field",
      { filter: "blur(18px)", scale: 1.05 },
      { filter: "blur(0px)", scale: 1, duration: 1.2 },
      "<"
    )
    .fromTo(
      ".hero .reveal",
      { autoAlpha: 0, y: 22, filter: "blur(10px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.1 },
      ">-0.22"
    )
    .fromTo(
      ".hero-title .split-char",
      { autoAlpha: 0, yPercent: 112, filter: "blur(12px)" },
      {
        autoAlpha: 1,
        yPercent: 0,
        filter: "blur(0px)",
        duration: 1.05,
        stagger: { each: 0.024, from: "start" },
        ease: "expo.out"
      },
      "<0.12"
    )
    .to(
      ".hero-title",
      {
        textShadow: "0 0 34px rgba(255,111,145,0.42), 0 0 70px rgba(247,207,111,0.18)",
        duration: 0.72,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      },
      ">-0.08"
    );

  return tl;
}

function initAmbientMotion() {
  gsap.to(".gradient-field", {
    backgroundPosition: "82% 45%",
    duration: 22,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  });

  gsap.to(".loader__mark span", {
    rotate: "+=360",
    duration: 16,
    repeat: -1,
    ease: "none",
    stagger: 0.4
  });

  gsap.to(".screen-shimmer", {
    x: "240%",
    opacity: 1,
    duration: 1.6,
    repeat: -1,
    repeatDelay: 7.5,
    ease: "power2.inOut"
  });
}

function initConstellation() {
  const center = { x: 0, y: 0 };

  const radii = [60, 100, 140]; // match your 3 rings

  qsa(".constellation-heart").forEach((heart, index) => {
    const r = radii[index % radii.length]; // assign ring
    const startAngle = Math.random() * Math.PI * 2;

    // create circular path dynamically
    const path = [];
    const points = 40;

    for (let i = 0; i <= points; i++) {
      const angle = startAngle + (i / points) * Math.PI * 2;
      path.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }

    // ORBIT
    gsap.to(heart, {
      motionPath: {
        path: path,
        curviness: 1
      },
      duration: 10 + Math.random() * 6,
      repeat: -1,
      ease: "none"
    });

    // PULSE
    gsap.to(heart, {
      scale: 1 + Math.random() * 0.3,
      opacity: 0.7 + Math.random() * 0.3,
      duration: 2 + Math.random(),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  });

  // rings rotate (keep this)
  gsap.to(".constellation-ring", {
    rotate: (index) => [360, -360, 360][index],
    duration: (index) => [34, 28, 22][index],
    repeat: -1,
    ease: "none"
  });
}

function setTone(section) {
  const tone = {
    "--tone-a": section.dataset.toneA,
    "--tone-b": section.dataset.toneB,
    "--tone-c": section.dataset.toneC
  };
  gsap.to(":root", {
    ...tone,
    duration: 1.2,
    ease: "sine.inOut"
  });
}

function initScrollScenes() {
  qsa(".scene").forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 58%",
      end: "bottom 42%",
      onEnter: () => setTone(section),
      onEnterBack: () => setTone(section)
    });

    gsap.fromTo(
      section,
      { scale: 0.985 },
      {
        scale: 1,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          toggleActions: "play none none reverse"
        }
      }
    );

    const reveals = qsa(".reveal", section);
    if (reveals.length) {
      gsap.fromTo(
        reveals,
        { autoAlpha: 0, y: 42, filter: "blur(12px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.92,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            once: true
          }
        }
      );
    }

    qsa("[data-speed]", section).forEach((layer) => {
      const speed = Number(layer.dataset.speed || 0.1);
      gsap.to(layer, {
        y: () => -window.innerHeight * speed,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });
  });

  qsa(".split-words").forEach((heading) => {
    gsap.fromTo(
      qsa(".split-word", heading),
      { yPercent: 90, autoAlpha: 0, filter: "blur(8px)" },
      {
        yPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.045,
        ease: "expo.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 80%",
          once: true
        }
      }
    );
  });
}

function initCursor() {
  if (!state.customCursor) return;

  const dot = qs(".cursor-dot");
  const glow = qs(".cursor-glow");

  const moveDotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
  const moveDotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });

  const moveGlowX = gsap.quickTo(glow, "x", { duration: 0.25, ease: "power3.out" });
  const moveGlowY = gsap.quickTo(glow, "y", { duration: 0.25, ease: "power3.out" });

  let lastTrail = 0;

  const colors = [
    "#ff005d", // pink/red
    "#e600ff", // purple
    "#ff08e6"  // blue
  ];

  window.addEventListener("pointermove", (event) => {
    const x = event.clientX;
    const y = event.clientY;

    moveDotX(x);
    moveDotY(y);
    moveGlowX(x);
    moveGlowY(y);

    gsap.to([dot, glow], { opacity: 1, duration: 0.2 });

    const now = performance.now();

    if (now - lastTrail > 3) {
      lastTrail = now;

      const trail = document.createElement("span");
      trail.className = "cursor-trail";
      document.body.appendChild(trail);

      const color = colors[Math.floor(Math.random() * colors.length)];

      gsap.set(trail, {
        x,
        y,
        background: color,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
        scale: 0.8
      });

      gsap.to(trail, {
        scale: 1.8,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => trail.remove()
      });
    }
  });

  qsa("a, button, input").forEach((el) => {
    el.addEventListener("pointerenter", () => {
      gsap.to(glow, {
        scale: 1.4,
        borderColor: "rgba(219, 17, 171, 0.8)",
        backgroundColor: "rgba(255, 77, 141, 0.15)",
        duration: 0.2
      });
    });

    el.addEventListener("pointerleave", () => {
      gsap.to(glow, {
        scale: 1,
        borderColor: "rgba(219, 17, 171, 0.4)",
        backgroundColor: "rgba(255, 77, 141, 0.1)",
        duration: 0.2
      });
    });
  });
}

function initMouseParallax() {
  const layers = qsa("[data-parallax]");
  const moveLayer = layers.map((layer) => ({
    layer,
    x: gsap.quickTo(layer, "x", { duration: 1.15, ease: "power3.out" }),
    y: gsap.quickTo(layer, "y", { duration: 1.15, ease: "power3.out" })
  }));

  window.addEventListener("pointermove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    moveLayer.forEach(({ layer, x: moveX, y: moveY }) => {
      const depth = Number(layer.dataset.depth || 0.08);
      moveX(x * -160 * depth);
      moveY(y * -110 * depth);
    });

    reactHearts(event.clientX, event.clientY);
  });
}

function initMagneticElements() {
  qsa(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const relX = event.clientX - rect.left - rect.width / 2;
      const relY = event.clientY - rect.top - rect.height / 2;
      gsap.to(element, {
        x: relX * 0.14,
        y: relY * 0.14,
        duration: 0.35,
        ease: "power3.out"
      });
    });

    element.addEventListener("pointerleave", () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.55,
        ease: "elastic.out(1, 0.35)"
      });
    });
  });
}

function initTiltCards() {
  qsa(".tilt-card").forEach((card) => {
    gsap.set(card, { y: 6 });
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      gsap.to(card, {
        rotateX: y * -7,
        rotateY: x * 8,
        transformPerspective: 900,
        duration: 0.42,
        ease: "power3.out"
      });
    });

    card.addEventListener("pointerleave", () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        y: 6,
        duration: 0.7,
        ease: "elastic.out(1, 0.34)"
      });
    });
  });
}

function initCompliments() {
  qsa(".compliment-card").forEach((card, index) => {
    gsap.to(card, {
      y: -8,
      duration: 2.6 + index * 0.13,
      delay: index * 0.14,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    card.addEventListener("pointerenter", () => {
      gsap.to(card, {
        scale: 1.035,
        rotate: random(-1.1, 1.1),
        boxShadow: "0 26px 90px rgba(255,111,145,0.24), 0 0 34px rgba(247,207,111,0.12)",
        backgroundColor: "rgba(255,255,255,0.145)",
        duration: 0.32,
        ease: "power3.out"
      });
      gsap.to(card, { "--line": "rgba(255,255,255,0.34)", duration: 0.32 });
    });

    card.addEventListener("pointerleave", () => {
      gsap.to(card, {
        scale: 1,
        rotate: 0,
        boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
        backgroundColor: "rgba(255,255,255,0.09)",
        duration: 0.45,
        ease: "power3.out"
      });
    });

    card.addEventListener("click", (event) => {
      gsap.fromTo(
        card,
        { scale: 0.97 },
        { scale: 1.04, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" }
      );
      burstHearts(event.clientX, event.clientY, 18);
      sparkleBurst(event.clientX, event.clientY, 26);
    });
  });
}

function createHeartShell(className = "floating-heart") {
  const shell = document.createElement("span");
  const drift = document.createElement("span");
  const symbol = document.createElement("span");
  shell.className = className;
  drift.className = "heart-drift";
  symbol.className = "heart-symbol";
  symbol.textContent = "\u2665";
  drift.appendChild(symbol);
  shell.appendChild(drift);
  return { shell, drift, symbol };
}

function spawnFloatingHeart(options = {}) {
  if (prefersReducedMotion) {
    return;
  }

  const heartField = qs("#heartField");
  const { shell, drift, symbol } = createHeartShell();
  heartField.appendChild(shell);

  const size = random(options.celebration ? 15 : 10, options.celebration ? 32 : 24);
  const startX = options.x ?? random(30, window.innerWidth - 30);
  const startY = window.innerHeight + random(24, 90);
  const driftX = random(-120, 120);
  const duration = random(options.celebration ? 5.8 : 8.5, options.celebration ? 8.5 : 14);
  const opacity = random(0.38, options.celebration ? 0.92 : 0.68);
  const wobble = random(1.2, 2.8);
  const path = [
    { x: startX, y: startY },
    { x: startX + driftX * 0.35, y: startY - window.innerHeight * 0.28 },
    { x: startX - driftX * 0.45, y: startY - window.innerHeight * 0.62 },
    { x: startX + driftX, y: -90 }
  ];

  gsap.set(shell, { x: startX, y: startY, opacity: 0, scale: size / 20, rotate: random(-18, 18) });
  gsap.set(symbol, { fontSize: `${size}px` });

  const record = { shell, symbol };
  state.activeHearts.push(record);

  gsap.to(drift, {
    x: random(-24, 24),
    duration: wobble,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  gsap
    .timeline({
      onComplete: () => {
        shell.remove();
        state.activeHearts = state.activeHearts.filter((item) => item.shell !== shell);
      }
    })
    .to(shell, { opacity, duration: 0.5, ease: "sine.out" }, 0)
    .to(
      shell,
      {
        motionPath: { path, curviness: 1.55 },
        duration,
        ease: "none"
      },
      0
    )
    .to(shell, { opacity: 0, scale: size / 28, duration: 1.1, ease: "sine.in" }, duration - 1.1);
}

function initFloatingHearts() {
  if (prefersReducedMotion) {
    return;
  }

  for (let index = 0; index < 18; index += 1) {
    gsap.delayedCall(index * 0.18, () => spawnFloatingHeart());
  }

  gsap.delayedCall(1.2, function loop() {
    if (state.activeHearts.length < 44) {
      spawnFloatingHeart();
    }
    gsap.delayedCall(random(0.42, 0.95), loop);
  });
}

function reactHearts(pointerX, pointerY) {
  if (!state.activeHearts.length) {
    return;
  }

  state.activeHearts.forEach(({ shell, symbol }) => {
    const rect = shell.getBoundingClientRect();
    const heartX = rect.left + rect.width / 2;
    const heartY = rect.top + rect.height / 2;
    const dx = pointerX - heartX;
    const dy = pointerY - heartY;
    const distance = Math.hypot(dx, dy);

    if (distance < 130) {
      const force = (130 - distance) / 130;
      gsap.to(symbol, {
        x: -dx * 0.18 * force,
        y: -dy * 0.18 * force,
        scale: 1 + force * 0.55,
        duration: 0.25,
        ease: "power2.out"
      });
    } else {
      gsap.to(symbol, { x: 0, y: 0, scale: 1, duration: 0.55, ease: "power2.out" });
    }
  });
}

function burstHearts(x, y, count = 35) {
  for (let index = 0; index < count; index += 1) {
    const heart = document.createElement("span");
    heart.className = "burst-heart";
    heart.textContent = "\u2665";
    document.body.appendChild(heart);

    const angle = random(0, Math.PI * 2);
    const distance = random(48, 190);
    const size = random(12, 26);

    gsap.set(heart, { x, y, fontSize: `${size}px`, scale: 0.4, opacity: 1 });
    gsap.to(heart, {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance - random(20, 90),
      rotate: random(-90, 90),
      scale: random(0.7, 1.45),
      opacity: 0,
      duration: random(0.72, 1.35),
      ease: "power3.out",
      onComplete: () => heart.remove()
    });
  }
}

function burstConfetti(x, y, count = 99) {
  const colors = ["#ff6f91", "#ff9a76", "#f7cf6f", "#65d5cd", "#fff8ee"];

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.background = colors[index % colors.length];
    document.body.appendChild(piece);

    const angle = random(-Math.PI, Math.PI);
    const distance = random(80, 330);

    gsap.set(piece, { x, y, rotate: random(0, 180), scale: random(0.55, 1.1), opacity: 1 });
    gsap.to(piece, {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance + random(80, 240),
      rotate: `+=${random(180, 720)}`,
      opacity: 0,
      duration: random(1.1, 2.2),
      ease: "power2.out",
      onComplete: () => piece.remove()
    });
  }
}

function celebrationMode(duration = 6200) {
  const started = performance.now();

  function pulse() {
    if (performance.now() - started > duration) {
      return;
    }
    for (let index = 0; index < 4; index += 1) {
      spawnFloatingHeart({ celebration: true });
    }
    gsap.delayedCall(0.22, pulse);
  }

  pulse();
}

function initNoteTyping() {
  const lines = qsa(".typing-line");
  const tl = gsap.timeline({ paused: true });

  lines.forEach((line, index) => {
    const proxy = { amount: 0 };
    const getText = () => line.dataset.template.replace("{name}", state.name.trim() || "you");

    tl.fromTo(line, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.32 }, index === 0 ? 0 : ">0.6");
    tl.to(proxy, {
      amount: 1,
      duration: () => clamp(getText().length * 0.12, 0.3, 15),
      ease: "none",
      onStart: () => {
        line.textContent = "";
        proxy.amount = 0;
      },
      onUpdate: () => {
        const text = getText();
        line.textContent = text.slice(0, Math.ceil(text.length * proxy.amount));
      }
    });
  });

  gsap.to(".note-panel", {
    boxShadow: "0 26px 90px rgba(101,213,205,0.16), 0 0 46px rgba(255,111,145,0.12)",
    duration: 0.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    scrollTrigger: {
      trigger: ".note-panel",
      start: "top 80%"
    }
  });

  ScrollTrigger.create({
    trigger: ".note-panel",
    start: "top 68%",
    once: true,
    onEnter: () => {
      state.noteStarted = true;
      tl.play();
    }
  });
}

function initSurprise() {
  const button = qs("#surpriseButton");
  const message = qs("#surpriseMessage");
  let opened = false;

  button.addEventListener("click", (event) => {
    const rect = button.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(button, {
      scale: 1.08,
      boxShadow:
        "0 22px 90px rgba(255,111,145,0.46), 0 0 42px rgba(247,207,111,0.24)",
      duration: 0.22
    })
      .to(".celebration-vignette", { opacity: 1, duration: 0.45 }, 0)
      .add(() => {
        burstHearts(x, y, 42);
        burstConfetti(x, y, 92);
        sparkleBurst(x, y, 70);
        celebrationMode();
      }, 0.2)
      .to(button, { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.32)" }, ">-0.1")
      .set(message, { visibility: "visible" }, "<")
      .to(message, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.86
      }, opened ? "<" : ">-0.08")
      .fromTo(
        qsa(".split-word", message),
        { yPercent: 80, autoAlpha: 0, filter: "blur(10px)" },
        { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.72, stagger: 0.035, ease: "expo.out" },
        "<0.12"
      )
      .to(".celebration-vignette", { opacity: 0, duration: 1.1 }, ">-0.25")

      // 💖 HEART EXPLOSION + REDIRECT
      .add(() => {
        const heart = document.querySelector(".heart-transition");

        gsap.set(heart, {
          x: x,
          y: y,
          scale: 0,
          opacity: 1
        });

        gsap.timeline()
          // 💥 pop
          .to(heart, {
            scale: 3,
            duration: 0.3,
            ease: "back.out(2)"
          })

          // ❤️ expand full screen
          .to(heart, {
            scale: 220,
            duration: 1,
            ease: "power4.inOut"
          })

          // 🌌 fade out page
          .to("body", {
            opacity: 0,
            duration: 0.6
          }, "-=0.3")

          // 🔗 open heart.html
          .add(() => {
            window.location.href = "style/heart.html";
          });

      }, ">-0.2");

    opened = true;
  });
}

function initMusic() {
  const button = qs("#musicToggle");

  gsap.to(button, {
    scale: 1.045,
    duration: 2.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  button.addEventListener("click", async (event) => {
    createRipple(button, event);

    if (!state.audio) {
      state.audio = createAmbientAudio();
    }

    if (!state.playing) {
      await state.audio.start();
      state.playing = true;
    } else {
      state.audio.stop();
      state.playing = false;
    }

    button.setAttribute("aria-pressed", String(state.playing));
    button.setAttribute("aria-label", state.playing ? "Pause ambient music" : "Play ambient music");
    const icon = qs("i", button);
    icon.setAttribute("data-lucide", state.playing ? "pause" : "music-2");
    if (window.lucide) {
      lucide.createIcons();
    }
  });
}

function createAmbientAudio() {
  const playlist = [
    "assets/Mac DeMarco __ No Other Heart.mp3",
    "assets/The Beatles - Here, There and Everywhere.mp3",
    "assets/CRUSH - BENNYKAAY (GUITAR ONLY VERSION).mp3"
  ];

  let index = 0;
  let shuffle = false;
  let repeat = true;

  const audio = new Audio();
  audio.volume = 0;
  audio.loop = false;

  function loadSong(i) {
    audio.src = playlist[i];
    audio.load();
  }

  function getNextIndex() {
    if (shuffle) {
      return Math.floor(Math.random() * playlist.length);
    }
    return (index + 1) % playlist.length;
  }

  loadSong(index);

  audio.addEventListener("ended", () => {
    if (!repeat && index === playlist.length - 1) return;

    index = getNextIndex();
    loadSong(index);
    audio.play();
  });

  return {
    start: async () => {
      await audio.play();
      gsap.to(audio, { volume: 0.6, duration: 1 });
    },

    stop: () => {
      gsap.to(audio, {
        volume: 0,
        duration: 1,
        onComplete: () => audio.pause()
      });
    },

    next: async () => {
      index = (index + 1) % playlist.length;
      loadSong(index);
      await audio.play();
    },

    prev: async () => {
      index = (index - 1 + playlist.length) % playlist.length;
      loadSong(index);
      await audio.play();
    },

    toggleShuffle: () => {
      shuffle = !shuffle;
    },

    toggleRepeat: () => {
      repeat = !repeat;
    }
  };
}

function createRipple(button, event) {
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  button.appendChild(ripple);

  gsap.set(ripple, {
    left: event.clientX - rect.left,
    top: event.clientY - rect.top
  });

  gsap.to(ripple, {
    scale: 8,
    opacity: 0,
    duration: 0.62,
    ease: "power2.out",
    onComplete: () => ripple.remove()
  });
}

const sparkleSystem = (() => {
  const canvas = qs("#sparkleCanvas");
  const ctx = canvas.getContext("2d");
  const particles = [];
  const bursts = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    particles.length = 0;
    const count = Math.min(110, Math.floor((window.innerWidth * window.innerHeight) / 13000));
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.012 + 0.004,
        hue: Math.random() > 0.45 ? "255,248,238" : "101,213,205"
      });
    }
  }

  function addBurst(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 3.7 + 1.2;
      bursts.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        decay: Math.random() * 0.018 + 0.014,
        size: Math.random() * 2.8 + 1,
        hue: index % 3 === 0 ? "247,207,111" : index % 3 === 1 ? "255,111,145" : "255,248,238"
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.phase += particle.speed;
      const twinkle = (Math.sin(particle.phase) + 1) / 2;
      const alpha = 0.08 + twinkle * 0.45;
      const size = particle.size + twinkle * 1.2;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${particle.hue}, ${alpha})`;
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let index = bursts.length - 1; index >= 0; index -= 1) {
      const particle = bursts[index];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.035;
      particle.life -= particle.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(particle.life, 0);
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.life * 6);
      ctx.fillStyle = `rgba(${particle.hue}, 1)`;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();

      if (particle.life <= 0) {
        bursts.splice(index, 1);
      }
    }

    requestAnimationFrame(render);
  }

  window.addEventListener("resize", () => {
    resize();
    seed();
    ScrollTrigger.refresh();
  });

  resize();
  seed();
  render();

  return { addBurst };
})();

function sparkleBurst(x, y, count = 34) {
  if (!prefersReducedMotion) {
    sparkleSystem.addBurst(x, y, count);
  }
}

function initReducedMotionFallback() {
  if (!prefersReducedMotion) {
    return;
  }

  gsap.set(".loader", { autoAlpha: 0 });
  gsap.set(".reveal, .hero-title .split-char, .split-word, .surprise-message", {
    autoAlpha: 1,
    y: 0,
    filter: "none"
  });
}

function init() {
  if (prefersReducedMotion) {
    initReducedMotionFallback();
    return;
  }

  initAmbientMotion();
  initConstellation();
  initCursor();
  initMouseParallax();
  initMagneticElements();
  initTiltCards();
  initCompliments();
  initFloatingHearts();
  initScrollScenes();
  initNoteTyping();
  initSurprise();
  initMusic();
  updatePersonalText();
  introTimeline();
}

window.addEventListener("load", init);

qs(".constellation-label").addEventListener("click", (event) => {
  const x = event.clientX;
  const y = event.clientY;

  // burst effects
  burstHearts(x, y, 28);
  sparkleBurst(x, y, 50);
  burstConfetti(x, y, 60);

  // pulse the label
  gsap.timeline()
    .to(".constellation-label", { scale: 1.6, color: "#fff", duration: 0.6, ease: "power3.out" })
    .to(".constellation-label", { scale: 0, opacity: 0, duration: 0.8, ease: "power3.in" })

  // flash the whole screen then fade out page then open
  gsap.to(".celebration-vignette", { opacity: 1, duration: 0.8, delay: 0.9,
    onComplete: () => {
      // fade entire page to black
      gsap.to("body", { opacity: 0, duration: 1.4, ease: "power2.inOut",
        onComplete: () => {
          window.location.href = "galaxy/galaxy.html";
        }
      });
    }
  });
});