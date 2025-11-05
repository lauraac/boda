// ========= CONFIG =========
/**
 * Si tu evento es a las 6:00 pm en Ciudad de México, usa -06:00 (ya no hay DST).
 * Ajusta la zona si aplica a otra ciudad.
 */
const EVENT_DATE = new Date("2025-08-09T18:00:00-06:00");

// Número de WhatsApp (solo dígitos, 52 + lada + número).
const WHATS_NUMBER = "52XXXXXXXXXX";

// ========= UTIL =========
const $id = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");

// ========= DESKTOP NOTICE GUARD =========
// Evita que se muestre el aviso en móviles aunque el navegador esté en “ver como escritorio”.
(function ensureMobileAppVisible() {
  const isDesktop =
    window.matchMedia("(min-width: 900px)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(pointer: fine)").matches;
  if (isDesktop) {
    document
      .querySelector(".app")
      ?.setAttribute("style", "display:none!important");
    document
      .querySelector(".desktop-notice")
      ?.setAttribute("style", "display:flex!important;min-height:100dvh");
  } else {
    document
      .querySelector(".desktop-notice")
      ?.setAttribute("style", "display:none!important");
    document
      .querySelector(".app")
      ?.setAttribute("style", "display:block!important");
  }
})();

// ========= COUNTDOWN =========
(function startCountdown() {
  function render() {
    const now = Date.now();
    const diff = Math.max(0, EVENT_DATE.getTime() - now);

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const m = Math.floor(diff / (1000 * 60)) % 60;
    const s = Math.floor(diff / 1000) % 60;

    $id("d") && ($id("d").textContent = pad2(d));
    $id("h") && ($id("h").textContent = pad2(h));
    $id("m") && ($id("m").textContent = pad2(m));
    $id("s") && ($id("s").textContent = pad2(s));
  }

  render();
  // setInterval tiene menos deriva que llamar recursivo a setTimeout.
  const iv = setInterval(() => {
    render();
    // Para cuando llegue a cero exacto:
    if (EVENT_DATE.getTime() - Date.now() <= 0) clearInterval(iv);
  }, 1000);
})();

// ========= WHATSAPP RSVP =========
(function fixWhatsLink() {
  const btn = document.getElementById("btnRSVP");
  if (!btn || !btn.href) return;

  // Limpia el número a solo dígitos
  const digits = String(WHATS_NUMBER).replace(/\D/g, "");

  // Recomendado: 12 o 13 dígitos (ej. 52 + 10 dígitos)
  if (!/^\d{12,13}$/.test(digits)) {
    console.warn("WHATS_NUMBER parece inválido:", WHATS_NUMBER);
  }

  try {
    const url = new URL(btn.href);
    // Fuerza formato correcto wa.me/<numero>
    url.protocol = "https:";
    url.hostname = "wa.me";
    url.pathname = "/" + digits;
    // Conserva el texto si ya venía en el href
    btn.href = url.toString();
  } catch (e) {
    // Si hay un href raro, lo reconstruimos
    const current = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set("text", "Hola, confirmo mi asistencia a su boda 💍");
    btn.href = `https://wa.me/${digits}?${params.toString()}`;
  }
})();

// ========= ?reservados=2 =========
(function reservedFromQuery() {
  const el = document.getElementById("rsv");
  if (!el) return;
  const params = new URLSearchParams(location.search);
  const r = parseInt(params.get("reservados"), 10);
  if (!isNaN(r) && r > 0 && r <= 20) el.textContent = String(r);
})();

(function () {
  const notice = document.getElementById("desktopNotice");
  const app = document.getElementById("app");
  const qr = document.getElementById("dnQr");
  const copyBtn = document.getElementById("dnCopy");
  const waBtn = document.getElementById("dnWhats");

  const url = window.location.href;

  const qrBase =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=";
  qr.src = qrBase + encodeURIComponent(url);

  waBtn.href =
    "https://wa.me/?text=" +
    encodeURIComponent("Hola, ábrelo en mi celular: " + url);

  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(url);
    copyBtn.textContent = "¡Copiado!";
    setTimeout(() => (copyBtn.textContent = "Copiar enlace"), 1500);
  });

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) {
    notice.hidden = false;
    app.hidden = true;
  } else {
    notice.hidden = true;
    app.hidden = false;
  }
})();
