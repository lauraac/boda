// ========= CONFIG =========
/**
 * Si tu evento es a las 6:00 pm en Ciudad de México, usa -06:00 (ya no hay DST).
 * Ajusta la zona si aplica a otra ciudad.
 */
const EVENT_DATE = new Date("2026-04-11T18:00:00-06:00");

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

(function countdown() {
  const write = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  const pad2 = (n) => String(n).padStart(2, "0");

  function render() {
    const now = Date.now();
    const diff = Math.max(0, EVENT_DATE.getTime() - now);

    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;

    // contador viejo (si existe)
    write("d", d);
    write("h", pad2(h));
    write("m", pad2(m));
    write("s", pad2(s));

    // contador “Faltan” (si existe)
    write("cdD", d);
    write("cdH", pad2(h));
    write("cdM", pad2(m));
    write("cdS", pad2(s));

    // Ajuste de ancho si DÍAS tiene 3 dígitos
    const box = document.querySelector("#faltan .count-box");
    if (box) box.classList.toggle("three-digits", d >= 100);

    if (diff === 0) clearInterval(iv);
  }

  render();
  const iv = setInterval(render, 1000);
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

// Espera a que el <audio> tenga metadatos para poder hacer seek con seguridad
function waitForMetadata(audio) {
  return new Promise((resolve) => {
    if (audio.readyState >= 1) return resolve();
    audio.addEventListener("loadedmetadata", resolve, { once: true });
  });
}

// ===== Música de fondo con autoplay + fade =====
(function () {
  const audio = document.getElementById("bgAudio");
  const fab = document.getElementById("audioFab");
  const icon = document.getElementById("audioIcon");
  if (!audio || !fab || !icon) return;

  const INITIAL_VOL = 0.06;
  const TARGET_VOL = 0.18;
  const FADE_MS = 1800;
  const START_AT = 5; // ⏱️ queremos iniciar en 0:36

  function setPauseIcon(paused) {
    icon.innerHTML = paused
      ? '<path d="M8 5v14l11-7-11-7z"></path>'
      : '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>';
    fab.classList.toggle("paused", paused);
    fab.setAttribute(
      "aria-label",
      paused ? "Reproducir música" : "Pausar música"
    );
    fab.title = paused ? "Reproducir música" : "Pausar música";
  }

  function fadeTo(target = TARGET_VOL, ms = FADE_MS) {
    const start = audio.volume;
    const delta = target - start;
    const t0 = performance.now();
    function step(t) {
      const k = Math.min(1, (t - t0) / ms);
      audio.volume = Math.max(0, Math.min(1, start + delta * k));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  async function primeAndPlay(fromSec = START_AT) {
    audio.volume = INITIAL_VOL;
    await waitForMetadata(audio); // 👈 garantiza metadatos
    audio.currentTime = fromSec; // 👈 fija 0:36 SIEMPRE
    await audio.play(); // intenta reproducir
    fadeTo(TARGET_VOL, FADE_MS);
    setPauseIcon(false);
  }

  async function tryAutoplay() {
    try {
      await primeAndPlay(START_AT); // 👈 también aquí
    } catch {
      // Bloqueado: esperamos primer gesto del usuario
      setPauseIcon(true);
      const unlock = async () => {
        try {
          await primeAndPlay(START_AT);
        } catch {}
        window.removeEventListener("touchstart", unlock, { once: true });
        window.removeEventListener("click", unlock, { once: true });
        window.removeEventListener("keydown", unlock, { once: true });
      };
      window.addEventListener("touchstart", unlock, {
        once: true,
        passive: true,
      });
      window.addEventListener("click", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    }
  }

  // Botón flotante
  fab.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await primeAndPlay(START_AT);
      } catch {}
    } else {
      audio.pause();
      setPauseIcon(true);
    }
  });

  // Arranque
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    tryAutoplay();
  } else {
    document.addEventListener("DOMContentLoaded", tryAutoplay, { once: true });
  }
})();
