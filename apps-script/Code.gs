/**
 * Backend de RSVP para la boda — Google Apps Script + Google Sheets
 *
 * Hojas:
 *  - Invitados:  Codigo | Nombre | Pases | Telefono | Notas
 *  - Respuestas: Codigo | Nombre | Asiste | Acompañantes | Total confirmados | Extras solicitados | Mensaje | Actualizado
 *  - Extras:     Codigo | Invitado | Nombre extra | Estado | Solicitado
 *    (Estado: Pendiente / Aprobado / Rechazado — lo cambian los novios a mano)
 *
 * Instalación: ver LEEME.md
 */

const MAX_EXTRAS = 4;
const SH = { inv: "Invitados", resp: "Respuestas", ext: "Extras" };

/* ---------- Ejecutar UNA vez desde el editor para crear las hojas ---------- */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const mk = (name, headers, sample) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(headers);
      sh.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#F2C4C0");
      sh.setFrozenRows(1);
      (sample || []).forEach((r) => sh.appendRow(r));
    }
    return sh;
  };
  mk(SH.inv, ["Codigo", "Nombre", "Pases", "Telefono", "Notas"], [
    [generarCodigo_(), "Familia Ejemplo", 2, "", ""],
    [generarCodigo_(), "Juan Pérez", 2, "", ""],
  ]);
  mk(SH.resp, ["Codigo", "Nombre", "Asiste", "Acompañantes", "Total confirmados", "Extras solicitados", "Mensaje", "Actualizado"]);
  const ext = mk(SH.ext, ["Codigo", "Invitado", "Nombre extra", "Estado", "Solicitado"]);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(["Pendiente", "Aprobado", "Rechazado"], true).build();
  ext.getRange("D2:D1000").setDataValidation(rule);
}

/* ---------- Llena códigos vacíos en la hoja Invitados ---------- */
function generarCodigosFaltantes() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.inv);
  const data = sh.getDataRange().getValues();
  const usados = new Set(data.slice(1).map((r) => String(r[0]).trim()).filter(Boolean));
  for (let i = 1; i < data.length; i++) {
    if (!String(data[i][0]).trim() && String(data[i][1]).trim()) {
      let c;
      do { c = generarCodigo_(); } while (usados.has(c));
      usados.add(c);
      sh.getRange(i + 1, 1).setValue(c);
      if (!data[i][2]) sh.getRange(i + 1, 3).setValue(2); // por defecto: persona + 1
    }
  }
}

function generarCodigo_() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar confusiones
  let s = "";
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

/* ---------- API ---------- */
function doGet(e) {
  const p = e.parameter || {};
  if (p.action === "lookup") return json_(lookup_(p.codigo));
  return json_({ ok: true, msg: "RSVP API" });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "JSON inválido" }); }
  if (body.action === "rsvp") return json_(guardar_(body));
  return json_({ ok: false, error: "Acción desconocida" });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function norm_(c) { return String(c || "").trim().toUpperCase().replace(/\s+/g, ""); }
function clean_(s, max) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, max || 80); }

function buscarInvitado_(codigo) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.inv);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (norm_(rows[i][0]) === codigo) {
      return { codigo, nombre: String(rows[i][1]), pases: Math.max(1, Number(rows[i][2]) || 2) };
    }
  }
  return null;
}

function lookup_(raw) {
  const codigo = norm_(raw);
  if (!codigo) return { ok: false, error: "Escribe tu código de invitación." };
  const inv = buscarInvitado_(codigo);
  if (!inv) return { ok: false, error: "No encontramos ese código. Revisa tu invitación." };

  const ss = SpreadsheetApp.getActive();
  let respuesta = null;
  const resp = ss.getSheetByName(SH.resp).getDataRange().getValues();
  for (let i = 1; i < resp.length; i++) {
    if (norm_(resp[i][0]) === codigo) {
      respuesta = {
        asiste: resp[i][2] === "Sí",
        acompanantes: String(resp[i][3] || "").split(" | ").filter(Boolean),
        mensaje: String(resp[i][6] || ""),
        extras: [],
      };
      break;
    }
  }
  if (respuesta) {
    const ext = ss.getSheetByName(SH.ext).getDataRange().getValues();
    for (let i = 1; i < ext.length; i++) {
      if (norm_(ext[i][0]) === codigo) respuesta.extras.push({ nombre: String(ext[i][2]), estado: String(ext[i][3] || "Pendiente") });
    }
  }
  return { ok: true, codigo: inv.codigo, nombre: inv.nombre, pases: inv.pases, respuesta };
}

function guardar_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const codigo = norm_(b.codigo);
    const inv = buscarInvitado_(codigo);
    if (!inv) return { ok: false, error: "Código no válido." };

    const asiste = b.asiste === true;
    const acomp = asiste ? (b.acompanantes || []).map((s) => clean_(s)).filter(Boolean).slice(0, inv.pases - 1) : [];
    const extras = asiste ? (b.extras || []).map((s) => clean_(s)).filter(Boolean).slice(0, MAX_EXTRAS) : [];
    const mensaje = clean_(b.mensaje, 500);
    const total = asiste ? 1 + acomp.length : 0;
    const now = new Date();

    const ss = SpreadsheetApp.getActive();
    // Respuestas: actualizar o insertar
    const rs = ss.getSheetByName(SH.resp);
    const rows = rs.getDataRange().getValues();
    const fila = [codigo, inv.nombre, asiste ? "Sí" : "No", acomp.join(" | "), total, extras.length, mensaje, now];
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (norm_(rows[i][0]) === codigo) { rs.getRange(i + 1, 1, 1, fila.length).setValues([fila]); found = true; break; }
    }
    if (!found) rs.appendRow(fila);

    // Extras: conservar Aprobado/Rechazado, quitar pendientes que ya no vienen, agregar nuevos
    const es = ss.getSheetByName(SH.ext);
    const ev = es.getDataRange().getValues();
    const wanted = new Set(extras.map((n) => n.toLowerCase()));
    const existing = new Set();
    for (let i = ev.length - 1; i >= 1; i--) {
      if (norm_(ev[i][0]) !== codigo) continue;
      const name = String(ev[i][2]).toLowerCase();
      const estado = String(ev[i][3] || "Pendiente");
      if (!wanted.has(name) && estado === "Pendiente") es.deleteRow(i + 1);
      else existing.add(name);
    }
    extras.forEach((n) => {
      if (!existing.has(n.toLowerCase())) es.appendRow([codigo, inv.nombre, n, "Pendiente", now]);
    });

    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
