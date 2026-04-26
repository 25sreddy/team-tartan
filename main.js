/**
 * Team Tartan — Three.js hero, GSAP scroll reveals, nav scrollspy
 */

import * as THREE from "three";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const CMU_RED = 0xc41230;
const NAVY = 0x1a1a2e;
const OFF_WHITE = 0xf5f5f8;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initHeroThree(canvas) {
  const reduced = prefersReducedMotion();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NAVY);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const point1 = new THREE.PointLight(CMU_RED, 2.2, 24, 2);
  point1.position.set(4, 3, 4);
  scene.add(point1);

  const point2 = new THREE.PointLight(OFF_WHITE, 0.9, 20, 2);
  point2.position.set(-5, -2, 3);
  scene.add(point2);

  const group = new THREE.Group();
  scene.add(group);

  const torusGeo = new THREE.TorusKnotGeometry(0.85, 0.22, 128, 16);
  const torusMat = new THREE.MeshStandardMaterial({
    color: CMU_RED,
    metalness: 0.35,
    roughness: 0.45,
    emissive: new THREE.Color(CMU_RED),
    emissiveIntensity: 0.15,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(-1.2, 0.3, 0);
  group.add(torus);

  const sphereGeo = new THREE.IcosahedronGeometry(0.55, 2);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: NAVY,
    metalness: 0.5,
    roughness: 0.35,
    emissive: new THREE.Color(0x3a3a55),
    emissiveIntensity: 0.2,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.set(1.4, -0.4, 0.8);
  group.add(sphere);

  const particleCount = window.innerWidth <= 768 ? 900 : 2200;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const colorRed = new THREE.Color(CMU_RED);
  const colorNavy = new THREE.Color(NAVY);
  const colorLight = new THREE.Color(OFF_WHITE);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 14;
    positions[i3 + 1] = (Math.random() - 0.5) * 10;
    positions[i3 + 2] = (Math.random() - 0.5) * 8;

    const roll = Math.random();
    const c = roll < 0.45 ? colorRed : roll < 0.78 ? colorNavy : colorLight;
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const pMat = new THREE.PointsMaterial({
    size: reduced ? 0.06 : 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  let targetRotX = 0;
  let targetRotY = 0;
  let mouseHandler;

  if (!reduced) {
    mouseHandler = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotY = nx * 0.35;
      targetRotX = ny * 0.22;
    };
    window.addEventListener("mousemove", mouseHandler, { passive: true });
  }

  function resize() {
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);

  let raf = 0;
  const clock = new THREE.Clock();

  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const slow = reduced ? 0.15 : 1;

    torus.rotation.x = t * 0.12 * slow;
    torus.rotation.y = t * 0.18 * slow;

    sphere.rotation.y = -t * 0.22 * slow;
    sphere.position.y = -0.4 + Math.sin(t * 0.7) * 0.12 * slow;

    group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
    group.rotation.y += (targetRotY - group.rotation.y) * 0.04;

    particles.rotation.y = t * 0.03 * slow;
    particles.rotation.x = Math.sin(t * 0.2) * 0.08 * slow;

    renderer.render(scene, camera);
  }

  if (!reduced) {
    animate();
  } else {
    renderer.render(scene, camera);
  }

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    if (mouseHandler) window.removeEventListener("mousemove", mouseHandler);
    torusGeo.dispose();
    torusMat.dispose();
    sphereGeo.dispose();
    sphereMat.dispose();
    pGeo.dispose();
    pMat.dispose();
    renderer.dispose();
  };
}

/**
 * Single secondary WebGL scene: rotating campus “globe” with wire overlay.
 */
function initGlobeThree(canvas) {
  if (!canvas) return () => {};
  const reduced = prefersReducedMotion();
  const stage = canvas.closest(".globe-stage") || canvas.parentElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.08, 100);
  camera.position.z = 2.65;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const group = new THREE.Group();
  scene.add(group);

  const ambient = new THREE.AmbientLight(0xffffff, 0.52);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(OFF_WHITE, 1.05);
  key.position.set(4.2, 2.2, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(CMU_RED, 0.42);
  rim.position.set(-3.2, -1.2, 2.4);
  scene.add(rim);

  const sphereGeo = new THREE.SphereGeometry(1, 72, 48);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: NAVY,
    metalness: 0.12,
    roughness: 0.78,
    emissive: new THREE.Color(NAVY),
    emissiveIntensity: 0.06,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  group.add(sphere);

  const wireGeo = new THREE.IcosahedronGeometry(1.035, 2);
  const wireMat = new THREE.MeshBasicMaterial({
    color: CMU_RED,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  group.add(wire);

  const geometries = [sphereGeo, wireGeo];
  const materials = [sphereMat, wireMat];

  function resize() {
    if (!stage) return;
    const w = stage.clientWidth || canvas.clientWidth || 1;
    const aspectTarget = 16 / 9;
    const maxH = Math.min(420, window.innerHeight * 0.42);
    const h = Math.min(stage.clientHeight || w / aspectTarget, maxH, w / aspectTarget);
    if (w < 2 || h < 2) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  resize();
  requestAnimationFrame(() => requestAnimationFrame(() => resize()));
  const ro = stage ? new ResizeObserver(resize) : null;
  if (stage && ro) ro.observe(stage);

  let raf = 0;
  const clock = new THREE.Clock();

  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const s = reduced ? 0.22 : 1;
    group.rotation.y = t * 0.38 * s;
    group.rotation.x = Math.sin(t * 0.28) * 0.07 * s;
    wire.rotation.y = -t * 0.12 * s;
    renderer.render(scene, camera);
  }

  if (!reduced) {
    animate();
  } else {
    resize();
    renderer.render(scene, camera);
  }

  return () => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    renderer.dispose();
  };
}

function initScrollAnimations() {
  if (prefersReducedMotion()) return;

  gsap.registerPlugin(ScrollTrigger);

  const defaults = {
    opacity: 0,
    y: 28,
    duration: 0.75,
    ease: "power3.out",
  };

  gsap.utils.toArray(".section-header").forEach((el) => {
    gsap.from(el, {
      ...defaults,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".pain-card.reveal").forEach((el, i) => {
    gsap.from(el, {
      ...defaults,
      delay: i * 0.05,
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.from(".stakeholders.reveal", {
    ...defaults,
    scrollTrigger: {
      trigger: ".stakeholders.reveal",
      start: "top 90%",
    },
  });

  gsap.utils.toArray(".feature-card.reveal").forEach((el, i) => {
    gsap.from(el, {
      ...defaults,
      delay: (i % 8) * 0.055,
      scrollTrigger: {
        trigger: el,
        start: "top 92%",
      },
    });
  });

  gsap.from(".solution-split.reveal", {
    ...defaults,
    scrollTrigger: { trigger: ".solution-split.reveal", start: "top 88%" },
  });

  gsap.utils.toArray(".workflow-step.reveal").forEach((el, i) => {
    gsap.from(el, {
      ...defaults,
      delay: i * 0.07,
      scrollTrigger: {
        trigger: el,
        start: "top 94%",
      },
    });
  });

  gsap.from(".differentiator.reveal", {
    ...defaults,
    scrollTrigger: { trigger: ".differentiator.reveal", start: "top 90%" },
  });

  gsap.utils.toArray(".strategy-block > h3").forEach((el) => {
    gsap.from(el, {
      ...defaults,
      scrollTrigger: {
        trigger: el.closest(".strategy-block"),
        start: "top 90%",
      },
    });
  });

  gsap.utils.toArray(".strategy-block__intro").forEach((el) => {
    gsap.from(el, {
      ...defaults,
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
      },
    });
  });

  gsap.from(".globe-band.scroll-anim", {
    ...defaults,
    scrollTrigger: {
      trigger: ".globe-band",
      start: "top 88%",
    },
  });

  gsap.from(".value-chain__item, .value-chain__arrow", {
    opacity: 0,
    x: -12,
    y: 14,
    duration: 0.65,
    stagger: 0.07,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".value-chain",
      start: "top 86%",
    },
  });

  gsap.from(".matrix__plot", {
    opacity: 0,
    scale: 0.93,
    duration: 0.85,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".matrix",
      start: "top 82%",
    },
  });

  gsap.utils.toArray(".matrix__point").forEach((el, i) => {
    gsap.from(el, {
      opacity: 0,
      scale: 0.82,
      duration: 0.5,
      delay: i * 0.05,
      ease: "back.out(1.35)",
      scrollTrigger: {
        trigger: ".matrix__plot",
        start: "top 80%",
      },
    });
  });

  gsap.from(".roadmap__phase", {
    ...defaults,
    stagger: 0.12,
    scrollTrigger: {
      trigger: ".roadmap",
      start: "top 85%",
    },
  });

  gsap.utils.toArray(".theory-card.reveal").forEach((el, i) => {
    gsap.from(el, {
      ...defaults,
      delay: i * 0.1,
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
      },
    });
  });

  gsap.utils.toArray(".stat-tile.reveal").forEach((el, i) => {
    gsap.from(el, {
      scale: 0.92,
      ...defaults,
      delay: i * 0.08,
      scrollTrigger: {
        trigger: el,
        start: "top 92%",
      },
    });
  });

  gsap.utils.toArray(".impact-column.reveal").forEach((col, i) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: col,
        start: "top 88%",
      },
      delay: i * 0.06,
    });
    tl.from(col, {
      opacity: 0,
      y: 26,
      duration: 0.62,
      ease: "power3.out",
    }).from(
      col.querySelectorAll("li"),
      {
        opacity: 0,
        x: -14,
        stagger: 0.065,
        duration: 0.48,
        ease: "power2.out",
      },
      "-=0.38"
    );
  });

  gsap.utils.toArray(".team-card.reveal").forEach((el, i) => {
    gsap.from(el, {
      ...defaults,
      delay: i * 0.08,
      scrollTrigger: {
        trigger: el,
        start: "top 92%",
      },
    });
  });

  gsap.from(".collaboration.reveal", {
    ...defaults,
    scrollTrigger: { trigger: ".collaboration.reveal", start: "top 90%" },
  });

  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

function initScrollSpy() {
  const navLinks = document.querySelectorAll(".site-nav a[data-section]");
  const sectionIds = ["problem", "solution", "strategy", "theory", "impact", "team"];

  const setActive = (key) => {
    navLinks.forEach((a) => {
      const active = a.dataset.section === key;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  const header = document.querySelector(".site-header");
  const headerH = header ? header.offsetHeight : 64;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;
      const id = visible[0].target.id;
      if (sectionIds.includes(id)) setActive(id);
    },
    {
      rootMargin: `-${headerH}px 0px -48% 0px`,
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    }
  );

  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY < 100) {
        navLinks.forEach((a) => {
          a.classList.remove("is-active");
          a.removeAttribute("aria-current");
        });
      }
    },
    { passive: true }
  );
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.getElementById("mobile-nav");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
    toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
  });

  panel.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = true;
      toggle.setAttribute("aria-label", "Open menu");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    toggle.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    toggle.setAttribute("aria-label", "Open menu");
    toggle.focus();
  });
}

function main() {
  const canvas = document.getElementById("hero-canvas");
  if (canvas) {
    try {
      initHeroThree(canvas);
    } catch (e) {
      console.warn("WebGL hero skipped:", e);
    }
  }

  const globeCanvas = document.getElementById("globe-canvas");
  if (globeCanvas) {
    try {
      initGlobeThree(globeCanvas);
    } catch (e) {
      console.warn("Globe WebGL skipped:", e);
    }
  }

  initScrollAnimations();
  initScrollSpy();
  initMobileNav();
}

main();
