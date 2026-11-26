/* ==========================================================================
   RSVP: modal de confirmación con código de invitación.
   Cada invitación incluye "pases" (por defecto 2 = titular + 1).
   Personas adicionales se envían como SOLICITUD (estado Pendiente).
   ========================================================================== */
(function () {
  const C = window.BODA;
  const DEMO = !C.rsvpEndpoint;
  const LS_KEY = "boda-rsvp";

  /* ---------------- API (Google Apps Script o demo) ---------------- */
  const api = {
    async lookup(codigo) {
      if (DEMO) {
        await wait(500);
        const inv = C.demoInvitados[codigo];
        if (!inv) return { ok: false, error: "No encontramos ese código. Revisa tu invitación." };
        const prev = JSON.parse(localStorage.getItem("demo-" + codigo) || "null");
        return { ok: true, codigo, nombre: inv.nombre, pases: inv.pases, respuesta: prev };
      }
      const url = C.rsvpEndpoint + "?action=lookup&codigo=" + encodeURIComponent(codigo);
      const r = await fetch(url, { redirect: "follow" });
      return r.json();
    },
    async submit(data) {
      if (DEMO) {
        await wait(700);
        const stored = {
          ...data,
          extras: data.extras.map((n) => ({ nombre: n, estado: "Pendiente" })),
        };
        localStorage.setItem("demo-" + data.codigo, JSON.stringify(stored));
        console.info("[RSVP demo] respuesta guardada:", stored);
        return { ok: true };
      }
      // text/plain evita el preflight CORS de Apps Script
      const r = await fetch(C.rsvpEndpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "rsvp", ...data }),
        redirect: "follow",
      });
      return r.json();
    },
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------------- Elementos ---------------- */
  const modal = document.getElementById("modal");
  const card = modal.querySelector(".modal-card");
  const loading = modal.querySelector(".modal-loading");
  const fCodigo = document.getElementById("formCodigo");
  const fResp = document.getElementById("formRespuesta");
  const inputCodigo = document.getElementById("inputCodigo");
  const ifYes = fResp.querySelector(".if-yes");
  const acompBox = document.getElementById("acompanantes");
  const wantExtras = document.getElementById("wantExtras");
  const extrasBox = fResp.querySelector(".extras");
  const extrasList = document.getElementById("extrasList");
  const addExtra = document.getElementById("addExtra");

  let invitado = null;
  let lastFocus = null;

  if (DEMO) document.getElementById("demoBadge").hidden = false;

  /* ---------------- Abrir / cerrar ---------------- */
  function open() {
    lastFocus = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (!modal.querySelector(".step.active")) show("codigo");
    setTimeout(() => {
      const f = modal.querySelector(".step.active input:not([type=radio]), .step.active button");
      f && f.focus({ preventScroll: true });
    }, 350);
    window.SFX && SFX.chime();
  }
  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  function show(step) {
    modal.querySelectorAll(".step").forEach((s) => s.classList.toggle("active", s.dataset.step === step));
    modal.querySelectorAll("[data-error]").forEach((e) => (e.textContent = ""));
    card.scrollTop = 0;
  }
  function busy(on) { loading.hidden = !on; }
  function err(form, msg) { form.querySelector("[data-error]").textContent = msg; }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-rsvp]")) { e.preventDefault(); open(); }
    if (e.target.closest("[data-close]")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });

  /* ---------------- Paso 1: código ---------------- */
  async function doLookup(codigo) {
    codigo = (codigo || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!codigo) return err(fCodigo, "Escribe tu código de invitación.");
    busy(true);
    try {
      const res = await api.lookup(codigo);
      if (!res.ok) return err(fCodigo, res.error || "Código no válido.");
      invitado = res;
      fillRespuesta(res);
      show("respuesta");
      window.SFX && SFX.tick();
    } catch (e) {
      console.error(e);
      err(fCodigo, "No pudimos conectar. Intenta de nuevo en un momento.");
    } finally {
      busy(false);
    }
  }
  fCodigo.addEventListener("submit", (e) => {
    e.preventDefault();
    doLookup(inputCodigo.value);
  });

  /* ---------------- Paso 2: respuesta ---------------- */
  function paseLabel(p) {
    if (p <= 1) return "Pase individual";
    if (p === 2) return "Pase doble · tú + 1";
    return `Pase para ${p} personas`;
  }

  function fillRespuesta(inv) {
    const prev = inv.respuesta || null;
    fResp.reset();
    fResp.querySelector("[data-nombre]").textContent = inv.nombre;
    fResp.querySelector("[data-pase]").textContent = paseLabel(inv.pases);
    fResp.querySelector("[data-prev]").hidden = !prev;

    // Campos para los acompañantes incluidos en el pase (pases - 1)
    acompBox.innerHTML = "";
    const n = Math.max(0, inv.pases - 1);
    for (let i = 0; i < n; i++) {
      const lab = document.createElement("label");
      lab.className = "field";
      lab.innerHTML = `<span>${n === 1 ? "Nombre de tu acompañante" : "Acompañante " + (i + 1)} <small>(opcional)</small></span>
        <input name="acompanante" maxlength="80" autocomplete="off" placeholder="Nombre y apellido" />`;
      acompBox.appendChild(lab);
    }

    extrasList.innerHTML = "";
    wantExtras.checked = false;
    extrasBox.hidden = true;
    ifYes.hidden = true;

    if (prev) {
      const radio = fResp.querySelector(`input[name=asiste][value=${prev.asiste ? "si" : "no"}]`);
      if (radio) radio.checked = true;
      ifYes.hidden = !prev.asiste;
      const inputs = acompBox.querySelectorAll("input");
      (prev.acompanantes || []).forEach((v, i) => inputs[i] && (inputs[i].value = v));
      const ex = prev.extras || [];
      if (ex.length) {
        wantExtras.checked = true;
        extrasBox.hidden = false;
        ex.forEach((x) => addExtraRow(typeof x === "string" ? x : x.nombre, x.estado));
      }
      fResp.mensaje.value = prev.mensaje || "";
    }
  }

  fResp.addEventListener("change", (e) => {
    if (e.target.name === "asiste") {
      ifYes.hidden = e.target.value !== "si";
      window.SFX && SFX.tick();
    }
  });

  wantExtras.addEventListener("change", () => {
    extrasBox.hidden = !wantExtras.checked;
    if (wantExtras.checked && !extrasList.children.length) addExtraRow();
  });

  function addExtraRow(value = "", estado) {
    if (extrasList.children.length >= C.maxExtras) {
      err(fResp, `Puedes solicitar hasta ${C.maxExtras} personas adicionales.`);
      return;
    }
    const li = document.createElement("li");
    li.innerHTML = `<input name="extra" maxlength="80" autocomplete="off" placeholder="Nombre y apellido" />
      <button type="button" class="rm" aria-label="Quitar persona">×</button>`;
    li.querySelector("input").value = value;
    if (estado) {
      const tag = document.createElement("span");
      tag.className = "estado " + String(estado).toLowerCase().replace(/[^a-z]/g, "");
      tag.textContent = estado;
      li.insertBefore(tag, li.querySelector(".rm"));
    }
    li.querySelector(".rm").onclick = () => {
      li.remove();
      if (!extrasList.children.length) { wantExtras.checked = false; extrasBox.hidden = true; }
    };
    extrasList.appendChild(li);
    if (!value) li.querySelector("input").focus();
    addExtra.hidden = extrasList.children.length >= C.maxExtras;
  }
  addExtra.addEventListener("click", () => addExtraRow());

  fResp.querySelector("[data-back]").addEventListener("click", () => {
    invitado = null;
    show("codigo");
    inputCodigo.select();
  });

  fResp.addEventListener("submit", async (e) => {
    e.preventDefault();
    const asiste = fResp.querySelector("input[name=asiste]:checked");
    if (!asiste) return err(fResp, "Cuéntanos si podrás acompañarnos.");
    const si = asiste.value === "si";
    const clean = (s) => s.trim().replace(/\s+/g, " ");
    const acompanantes = si ? [...acompBox.querySelectorAll("input")].map((i) => clean(i.value)).filter(Boolean) : [];
    const extras = si && wantExtras.checked
      ? [...extrasList.querySelectorAll("input")].map((i) => clean(i.value)).filter(Boolean)
      : [];
    if (si && wantExtras.checked && !extras.length) return err(fResp, "Escribe el nombre de cada persona adicional o desmarca la opción.");

    const data = {
      codigo: invitado.codigo,
      asiste: si,
      acompanantes,
      extras,
      mensaje: clean(fResp.mensaje.value || ""),
    };
    busy(true);
    try {
      const res = await api.submit(data);
      if (!res.ok) return err(fResp, res.error || "No se pudo guardar. Intenta de nuevo.");
      localStorage.setItem(LS_KEY, JSON.stringify({ codigo: data.codigo, asiste: si, t: Date.now() }));
      gracias(data);
      window.SFX && SFX.chime();
      document.dispatchEvent(new CustomEvent("rsvp:done", { detail: data }));
    } catch (e2) {
      console.error(e2);
      err(fResp, "No pudimos conectar. Intenta de nuevo en un momento.");
    } finally {
      busy(false);
    }
  });

  /* ---------------- Paso 3: gracias ---------------- */
  function gracias(d) {
    const t = modal.querySelector("[data-gracias-title]");
    const p = modal.querySelector("[data-gracias-text]");
    if (d.asiste) {
      const total = 1 + d.acompanantes.length;
      t.textContent = "¡Te esperamos!";
      let txt = `Confirmamos ${total} ${total === 1 ? "lugar" : "lugares"} para ${invitado.nombre}.`;
      if (d.extras.length) {
        txt += ` Recibimos tu solicitud para ${d.extras.length} ${d.extras.length === 1 ? "persona adicional" : "personas adicionales"}; te confirmaremos pronto si hay lugar.`;
      }
      p.textContent = txt;
    } else {
      t.textContent = "Te extrañaremos";
      p.textContent = "Gracias por avisarnos. Te llevaremos en el corazón ese día.";
    }
    show("gracias");
  }

  /* ---------------- API pública ---------------- */
  window.RSVP = {
    open,
    close,
    alreadyAnswered: () => !!localStorage.getItem(LS_KEY),
    // Si la URL trae ?codigo=XXXX se precarga y se busca automáticamente
    openFromUrl() {
      const code = new URLSearchParams(location.search).get("codigo");
      if (code) {
        open();
        inputCodigo.value = code.toUpperCase();
        doLookup(code);
        return true;
      }
      return false;
    },
  };
})();
