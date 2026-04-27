/**
 * Team Tartan — Minimal interactions
 */

import * as THREE from "three";

const CMU_RED = 0xc41230;
const NAVY = 0x1a1a2e;
const OFF_WHITE = 0xf5f5f8;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initHeroStars(canvas) {
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
  scene.add(particles);

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
    pGeo.dispose();
    pMat.dispose();
    renderer.dispose();
  };
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
      initHeroStars(canvas);
    } catch (e) {
      console.warn("WebGL hero skipped:", e);
    }
  }

  initScrollSpy();
  initMobileNav();
}

main();
