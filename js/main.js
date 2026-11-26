/* ==========================================================================
   Página principal: contenido, scroll suave, vista diagonal/vertical,
   pantalla de entrada, navegación, cuenta regresiva y pétalos.
   ========================================================================== */
(function () {
  const C = window.BODA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const body = document.body;

  /* ---------------- 1. Contenido desde config.js ---------------- */
  const binds = {
    nombres: `${C.novios.el} & ${C.novios.ella}`,
    nombresHtml: `${esc(C.novios.el)}<span class="amp">&amp;</span>${esc(C.novios.ella)}`,
    iniciales: C.novios.iniciales,
    fechaTexto: C.fechaTexto,
    frase: C.frase,
    vestimentaCodigo: C.vestimenta.codigo,
    vestimentaNota: C.vestimenta.nota,
    fechaLimiteRsvp: C.fechaLimiteRsvp,
  };
  $$("[data-bind]").forEach((el) => {
    const k = el.dataset.bind;
    if (k.endsWith("Html")) el.innerHTML = binds[k];
    else el.textContent = binds[k] ?? "";
  });
  document.title = `${C.novios.el} & ${C.novios.ella} · Nuestra boda`;

  $("#timeline").innerHTML = C.historia
    .map(
      (h) => `
    <article class="chapter">
      <div class="chapter-photo rv"><figure class="photo"><img src="${esc(h.foto)}" alt="${esc(h.titulo)}" loading="lazy"></figure></div>
      <div class="chapter-text rv">
        <div class="chapter-year">${esc(h.fecha)}</div>
        <h3>${esc(h.titulo)}</h3>
        <p>${esc(h.texto)}</p>
      </div>
    </article>`
    )
    .join("");

  const m = C.mascota;
  $("#pet").innerHTML = `
    <div class="rv"><figure class="photo"><img src="${esc(m.foto)}" alt="${esc(m.nombre)}" loading="lazy"></figure></div>
    <div class="rv">
      <svg class="pet-paw"><use href="#paw"/></svg>
      <p class="pet-name">${esc(m.nombre)}</p>
      <h3>${esc(m.titulo)}</h3>
      <p class="muted">${esc(m.texto)}</p>
    </div>`;

  const icons = ["church", "glasses", "ring"];
  $("#events").innerHTML = C.eventos
    .map(
      (ev, i) => `
    <div class="event rv">
      <svg><use href="#${icons[i % icons.length]}"/></svg>
      <p class="eyebrow">${esc(ev.tipo)}</p>
      <div class="time">${esc(ev.hora)}</div>
      <h3>${esc(ev.lugar)}</h3>
      <address>${esc(ev.direccion)}</address>
      <a class="btn btn-ghost btn-sm" href="${esc(ev.mapa)}" target="_blank" rel="noopener">Cómo llegar</a>
    </div>`
    )
    .join("");

  const palette = [
    ["#2F3E2C", "Verde musgo"], ["#8FA58A", "Salvia"], ["#A89A8E", "Mushroom"],
    ["#C8892A", "Ámbar"], ["#F2C4C0", "Rosa blush"], ["#7A1F2E", "Vino"],
  ];
  $("#swatches").innerHTML = palette.map(([c, n]) => `<div class="swatch"><i style="--sw:${c}"></i><span>${n}</span></div>`).join("");

  $("#gallery").innerHTML = C.galeria
    .map((src) => `<figure class="photo rv"><img src="${esc(src)}" alt="" loading="lazy"></figure>`)
    .join("");

  /* ---------------- 2. Motor de scroll ---------------- */
  const world = $("#world");
  const spacer = $("#spacer");
  const progress = $("#progress i");
  const isTouch = matchMedia("(pointer: coarse)").matches;
  let target = window.scrollY;
  let current = target;
  let vh = innerHeight;
  let worldH = 0;
  let reveals = [];
  let sections = [];

  function measure() {
    vh = innerHeight;
    worldH = world.offsetHeight;
    spacer.style.height = worldH + "px";
    reveals = $$(".rv", world).map((el) => ({ el, y: offsetIn(el) }));
    sections = $$("section.sec", world).map((el) => ({ id: el.id, y: el.offsetTop, h: el.offsetHeight }));
  }
  function offsetIn(el) {
    let y = 0;
    while (el && el !== world) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  window.addEventListener("scroll", () => (target = window.scrollY), { passive: true });
  window.addEventListener("resize", () => { measure(); target = window.scrollY; });

  let lastActive = "";
  function frame() {
    const ease = isTouch ? 0.22 : 0.085;
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.05) current = target;
    // El punto (scroll + mitad de pantalla) del mundo queda en el centro del plano
    world.style.transform = `translate3d(0, ${-(current + vh / 2)}px, 0)`;

    const max = Math.max(1, worldH - vh);
    progress.style.height = Math.min(100, (current / max) * 100) + "%";

    // Revelado: en diagonal se ve más contenido a la vez
    const ahead = body.classList.contains("view-diagonal") ? vh * 1.25 : vh * 0.88;
    for (const r of reveals) {
      if (!r.done && r.y < current + ahead) { r.el.classList.add("in"); r.done = true; }
    }

    // Sección activa
    const mid = current + vh * 0.45;
    let act = sections[0] && sections[0].id;
    for (const s of sections) if (mid >= s.y) act = s.id;
    if (act !== lastActive) {
      lastActive = act;
      $$(".nav-list a").forEach((a) => a.classList.toggle("active", a.dataset.goto === act));
    }
    body.classList.toggle("show-fab", current > vh * 0.6 && act !== "rsvp" && !body.classList.contains("is-gated"));

    requestAnimationFrame(frame);
  }

  function goTo(id) {
    const s = sections.find((x) => x.id === id);
    if (!s) return;
    window.scrollTo(0, Math.min(s.y, worldH - vh));
    target = window.scrollY;
    body.classList.remove("menu-open");
    window.SFX && SFX.tick();
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-goto]");
    if (a) { e.preventDefault(); goTo(a.dataset.goto); }
  });

  // Teclado: flechas / AvPág ya funcionan con el scroll nativo.

  /* ---------------- 3. Vista diagonal / vertical ---------------- */
  const viewBtn = $("#viewToggle");
  function setView(v, sound) {
    body.classList.toggle("view-diagonal", v === "diagonal");
    body.classList.toggle("view-vertical", v === "vertical");
    viewBtn.classList.toggle("is-b", v === "vertical");
    try { localStorage.setItem("boda-view", v); } catch (e) {}
    // el ancho de la columna puede cambiar entre vistas (móvil): volver a medir
    if (typeof measure === "function" && worldH) { measure(); target = window.scrollY; }
    if (sound) window.SFX && SFX.whoosh();
  }
  let savedView = "diagonal";
  try { savedView = localStorage.getItem("boda-view") || "diagonal"; } catch (e) {}
  setView(savedView);
  viewBtn.addEventListener("click", () => setView(body.classList.contains("view-diagonal") ? "vertical" : "diagonal", true));

  /* ---------------- 4. Sonido ---------------- */
  const soundBtn = $("#soundToggle");
  soundBtn.addEventListener("click", () => {
    const on = !SFX.enabled;
    SFX.setEnabled(on);
    soundBtn.classList.toggle("is-b", !on);
    if (on) SFX.tick();
  });

  /* ---------------- 5. Menú móvil ---------------- */
  $("#menuToggle").addEventListener("click", () => body.classList.toggle("menu-open"));

  /* ---------------- 6. Pantalla de entrada ---------------- */
  const gate = $("#gate");
  $("#enterBtn").addEventListener("click", () => {
    window.SFX && SFX.start();
    window.SFX && SFX.chime();
    gate.classList.add("open");
    body.classList.remove("is-gated");
    setTimeout(() => gate.classList.add("gone"), 1500);
    // Modal de confirmación al entrar (si no ha respondido en este dispositivo)
    setTimeout(() => {
      if (!RSVP.openFromUrl() && !RSVP.alreadyAnswered()) RSVP.open();
    }, 1700);
  });

  /* ---------------- 7. Cuenta regresiva ---------------- */
  const wedding = new Date(C.fecha).getTime();
  const cd = Object.fromEntries($$("[data-cd]").map((el) => [el.dataset.cd, el]));
  function tickCountdown() {
    let d = Math.max(0, wedding - Date.now()) / 1000;
    const days = Math.floor(d / 86400); d -= days * 86400;
    const h = Math.floor(d / 3600); d -= h * 3600;
    const mi = Math.floor(d / 60);
    const s = Math.floor(d - mi * 60);
    cd.d.textContent = days;
    cd.h.textContent = String(h).padStart(2, "0");
    cd.m.textContent = String(mi).padStart(2, "0");
    cd.s.textContent = String(s).padStart(2, "0");
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------------- 8. Pétalos ---------------- */
  const cv = $("#petals");
  const ctx = cv.getContext("2d");
  const colors = ["#F2C4C0", "#E9A9A4", "#7A1F2E", "#C8892A", "#8FA58A"];
  let petals = [];
  function resizeCanvas() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(34, innerWidth / 40));
    petals = Array.from({ length: n }, () => newPetal(true));
  }
  function newPetal(anywhere) {
    return {
      x: Math.random() * innerWidth,
      y: anywhere ? Math.random() * innerHeight : -20,
      r: 4 + Math.random() * 7,
      vy: 0.25 + Math.random() * 0.6,
      vx: -0.2 + Math.random() * 0.5,
      a: Math.random() * Math.PI * 2,
      va: -0.02 + Math.random() * 0.04,
      sway: Math.random() * Math.PI * 2,
      c: colors[(Math.random() * colors.length) | 0],
      o: 0.35 + Math.random() * 0.45,
    };
  }
  let lastScroll = 0;
  function drawPetals() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const dv = (current - lastScroll) * 0.15; // reaccionan al scroll
    lastScroll = current;
    for (const p of petals) {
      p.sway += 0.015;
      p.x += p.vx + Math.sin(p.sway) * 0.4;
      p.y += p.vy - dv * (p.r / 10);
      p.a += p.va;
      if (p.y > innerHeight + 20 || p.x > innerWidth + 20 || p.x < -20 || p.y < -40) Object.assign(p, newPetal(false), p.y < -40 ? { y: innerHeight + 10 } : {});
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.scale(1, 0.55 + Math.sin(p.sway * 2) * 0.25);
      ctx.globalAlpha = p.o;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.bezierCurveTo(p.r, -p.r, p.r, p.r * 0.6, 0, p.r);
      ctx.bezierCurveTo(-p.r, p.r * 0.6, -p.r, -p.r, 0, -p.r);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(drawPetals);
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    resizeCanvas();
    addEventListener("resize", resizeCanvas);
    requestAnimationFrame(drawPetals);
  }

  /* ---------------- Arranque ---------------- */
  measure();
  // Re-medir cuando carguen fuentes e imágenes
  document.fonts && document.fonts.ready.then(measure);
  addEventListener("load", measure);
  $$("img", world).forEach((img) => img.addEventListener("load", measure, { once: true }));
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  target = current = 0;
  requestAnimationFrame(frame);
})();
