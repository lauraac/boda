// ========= CONFIG =========
const EVENT_DATE = new Date("2026-04-11T18:00:00-06:00"); // hora local MX
const WHATS_NUMBER = "52XXXXXXXXXX"; // solo dígitos

// ========= HELPERS =========
const $id = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");

// ========= SOLO MÓVIL + AVISO ESCRITORIO =========
(function initDesktopNotice() {
  const notice = $id("desktopNotice");
  const app = $id("app");
  const qr = $id("dnQr");
  const copyBtn = $id("dnCopy");
  const waBtn = $id("dnWhats");

  const url = window.location.href;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // QR + Whats link
  const qrBase =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=";
  if (qr) qr.src = qrBase + encodeURIComponent(url);
  if (waBtn)
    waBtn.href =
      "https://wa.me/?text=" +
      encodeURIComponent("Hola, ábrelo en mi celular: " + url);
  if (copyBtn)
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(url);
      copyBtn.textContent = "¡Copiado!";
      setTimeout(() => (copyBtn.textContent = "Copiar enlace"), 1500);
    });

  // Toggle vistas
  if (!isMobile) {
    if (notice) notice.hidden = false;
    if (app) app.hidden = true;
  } else {
    if (notice) notice.hidden = true;
    if (app) app.hidden = false;
  }
})();

// ========= COUNTDOWN =========
(function countdown() {
  const write = (id, val) => {
    const el = $id(id);
    if (el) el.textContent = val;
  };

  function render() {
    const now = Date.now();
    const diff = Math.max(0, EVENT_DATE.getTime() - now);

    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;

    write("cdD", d);
    write("cdH", pad2(h));
    write("cdM", pad2(m));
    write("cdS", pad2(s));

    const box = document.querySelector("#faltan .count-box");
    if (box) box.classList.toggle("three-digits", d >= 100);

    if (diff === 0) clearInterval(iv);
  }

  render();
  const iv = setInterval(render, 1000);
})();

// ========= RSVP: Google Forms (prefill opcional) =========
const FORM_URL =
  "https://docs.google.com/forms/d/e/XXXXXXXXXXXX/viewform?usp=pp_url";
const FORM_ENTRIES = {
  nombre: "entry.1111111111",
  puedeAsistir: "entry.2222222222",
  lugares: "entry.3333333333",
  mensaje: "entry.4444444444",
};

function getReservados() {
  const r = parseInt(
    new URLSearchParams(location.search).get("reservados"),
    10
  );
  return !isNaN(r) && r > 0 && r <= 20 ? String(r) : "";
}

(function setFormLink() {
  const btn = $id("btnRSVP");
  if (!btn) return;

  const prefill = new URLSearchParams();
  const qp = new URLSearchParams(location.search);
  const nombre = qp.get("nombre") || "";
  if (nombre) prefill.set(FORM_ENTRIES.nombre, nombre);

  const lugares = getReservados();
  if (lugares) prefill.set(FORM_ENTRIES.lugares, lugares);

  const url = new URL(FORM_URL);
  for (const [k, v] of prefill.entries()) url.searchParams.set(k, v);
  btn.href = url.toString();
})();

// Mostrar número reservado desde query
(function reservedFromQuery() {
  const el = $id("rsv");
  if (!el) return;
  const params = new URLSearchParams(location.search);
  const r = parseInt(params.get("reservados"), 10);
  if (!isNaN(r) && r > 0 && r <= 20) el.textContent = String(r);
})();

// ========= Audio con autoplay suave + FAB =========
function waitForMetadata(audio) {
  return new Promise((resolve) => {
    if (audio.readyState >= 1) return resolve();
    audio.addEventListener("loadedmetadata", resolve, { once: true });
  });
}

(function audioPlayer() {
  const audio = $id("bgAudio");
  const fab = $id("audioFab");
  const icon = $id("audioIcon");
  if (!audio || !fab || !icon) return;

  const INITIAL_VOL = 0.06;
  const TARGET_VOL = 0.18;
  const FADE_MS = 1800;
  const START_AT = 5;

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
    await waitForMetadata(audio);
    audio.currentTime = fromSec;
    await audio.play();
    fadeTo(TARGET_VOL, FADE_MS);
    setPauseIcon(false);
  }

  async function tryAutoplay() {
    try {
      await primeAndPlay(START_AT);
    } catch {
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

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    tryAutoplay();
  } else {
    document.addEventListener("DOMContentLoaded", tryAutoplay, { once: true });
  }
})();
