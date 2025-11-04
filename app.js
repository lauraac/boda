// === Cuenta regresiva (ajusta fecha/hora local) ===
const EVENT_DATE = new Date("2025-08-09T18:00:00");

const byId = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

function tick() {
  const now = new Date();
  const diff = Math.max(0, EVENT_DATE - now);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const m = Math.floor(diff / (1000 * 60)) % 60;
  const s = Math.floor(diff / 1000) % 60;
  byId("d").textContent = pad(d);
  byId("h").textContent = pad(h);
  byId("m").textContent = pad(m);
  byId("s").textContent = pad(s);
  setTimeout(tick, 1000);
}
tick();

// === WhatsApp RSVP: cambia por tu número (13 dígitos, ej. 5255...) ===
const WHATS_NUMBER = "52XXXXXXXXXX";
(function () {
  const btn = document.getElementById("btnRSVP");
  if (!btn) return;
  try {
    const url = new URL(btn.href);
    url.pathname = "/" + WHATS_NUMBER;
    btn.href = url.toString();
  } catch (e) {}
})();

// === ?reservados=2 en la URL ===
(function () {
  const params = new URLSearchParams(location.search);
  const r = parseInt(params.get("reservados"), 10);
  if (!isNaN(r) && r > 0 && r <= 20) {
    const el = document.getElementById("rsv");
    if (el) el.textContent = r;
  }
})();
