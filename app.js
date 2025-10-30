// === Cuenta regresiva ===
// Ajusta a tu fecha/hora (UTC segura o local sin Z):
const EVENT_DATE = new Date("2025-08-09T18:00:00"); // 6:00 pm local

function pad(n) {
  return String(n).padStart(2, "0");
}
function tick() {
  const now = new Date();
  const diff = EVENT_DATE - now;
  const d = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const h = Math.max(0, Math.floor(diff / (1000 * 60 * 60)) % 24);
  const m = Math.max(0, Math.floor(diff / (1000 * 60)) % 60);
  const s = Math.max(0, Math.floor(diff / 1000) % 60);
  document.getElementById("d").textContent = pad(d);
  document.getElementById("h").textContent = pad(h);
  document.getElementById("m").textContent = pad(m);
  document.getElementById("s").textContent = pad(s);
  requestAnimationFrame(() => setTimeout(tick, 1000));
}
tick();

// === WhatsApp RSVP ===
// Cambia el número por el tuyo (a 13 dígitos, sin espacios).
const WHATS_NUMBER = "52XXXXXXXXXX"; // ej: "525581587467"
const btn = document.getElementById("btnRSVP");
if (btn) {
  const url = new URL(btn.href);
  url.pathname = "/" + WHATS_NUMBER;
  btn.href = url.toString();
}

// === “Lugares reservados” dinámico por querystring ?reservados=2 ===
(function () {
  const params = new URLSearchParams(location.search);
  const r = parseInt(params.get("reservados"), 10);
  if (!isNaN(r) && r > 0 && r <= 20) {
    const el = document.getElementById("rsv");
    if (el) el.textContent = r;
  }
})();
