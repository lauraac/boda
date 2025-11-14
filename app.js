// ===== Intro: video fullscreen, sin overlays ni textos =====
const intro = document.getElementById("intro-video-container");
const video = document.getElementById("intro-video");

// Crea el botón "Saltar" si no existe
let skipBtn = document.getElementById("skip-intro");
if (!skipBtn && intro) {
  skipBtn = document.createElement("button");
  skipBtn.id = "skip-intro";
  skipBtn.className = "skip-btn";
  skipBtn.type = "button";
  skipBtn.textContent = "Saltar video";
  intro.appendChild(skipBtn);
}

if (intro && video) {
  // Ocupa pantalla completa
  Object.assign(intro.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    background: "#000",
    display: "grid",
    placeItems: "center",
  });
  Object.assign(video.style, {
    width: "100vw",
    height: "100vh",
    objectFit: "cover",
  });

  // Silencia música de fondo durante el intro
  const bg = document.getElementById("bgAudio");
  if (bg) {
    try {
      bg.pause();
    } catch {}
    bg.muted = true;
  }

  // iOS-friendly
  video.setAttribute("playsinline", "");
  video.playsInline = true;
  video.muted = false;

  // Evitar que el primer toque (para desbloquear audio) también pause
  let justUnlocked = false;

  // Autoplay; si falla por políticas, desbloquear al primer toque/click
  video.play().catch(() => {
    const unlock = () => {
      justUnlocked = true;
      video.muted = false;
      video.play().catch(() => {});
      window.removeEventListener("touchstart", unlock, { once: true });
      window.removeEventListener("click", unlock, { once: true });
      window.removeEventListener("keydown", unlock, { once: true });
      setTimeout(() => {
        justUnlocked = false;
      }, 200);
    };
    window.addEventListener("touchstart", unlock, {
      once: true,
      passive: true,
    });
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  });

  const finishIntro = () => {
    intro.classList.add("fade-out");
    setTimeout(() => {
      intro.style.display = "none";
      document.dispatchEvent(new Event("intro:ended"));
    }, 1000);
  };

  video.addEventListener("ended", finishIntro);

  if (skipBtn) {
    skipBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // que no dispare el toggle
      try {
        video.pause();
      } catch {}
      finishIntro();
    });
  }

  // Tocar la pantalla = pausar/reanudar (sin mostrar nada)
  const toggle = () => {
    if (justUnlocked) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  ["pointerup", "touchend", "click"].forEach((ev) => {
    intro.addEventListener(
      ev,
      (e) => {
        if (e.target === skipBtn) return;
        toggle();
      },
      { passive: true }
    );
  });
}

// Tocar la pantalla pausa/reanuda el video
function togglePlayPause() {
  if (!video) return;
  if (video.paused) {
    // reanudar (iOS: esto cuenta como interacción válida)
    video.play().catch(() => {});
    pauseOverlay.hidden = true;
  } else {
    video.pause();
    pauseOverlay.hidden = false;
  }
}

// Escuchar toques/clicks en TODO el contenedor del intro
if (intro) {
  ["click", "pointerup", "touchend"].forEach((ev) =>
    intro.addEventListener(
      ev,
      (e) => {
        // si tocaron el botón "Saltar", no togglear
        if (e.target === skipBtn) return;
        togglePlayPause();
      },
      { passive: true }
    )
  );
}

// ========= CONFIG =========
const EVENT_DATE = new Date("2026-04-11T18:00:00-06:00"); // MX local
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScIe2cZNXGnV6x0CooqhrUSYLOrXf6-oghtEeeNJG4DyPOusQ/viewform";
const FORM_ENTRIES = {
  nombre: "entry.1111111111",
  puedeAsistir: "entry.2222222222",
  lugares: "entry.3333333333",
  mensaje: "entry.4444444444",
};

// ========= HELPERS =========
const $id = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");

// ========= AVISO ESCRITORIO / SOLO MÓVIL =========
(function initDesktopNotice() {
  const notice = $id("desktopNotice");
  const app = $id("app");
  const qr = $id("dnQr");
  const copyBtn = $id("dnCopy");
  const waBtn = $id("dnWhats");

  const url = window.location.href;
  const setVisible = (showApp) => {
    if (!notice || !app) return;
    notice.hidden = showApp;
    app.hidden = !showApp;
  };

  const isDesktopLike = () =>
    window.matchMedia("(min-width: 900px)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(pointer: fine)").matches;

  // Overrides por query / memoria
  const qsMode = new URLSearchParams(location.search).get("mode"); // "mobile" | "desktop"
  if (qsMode === "mobile" || qsMode === "desktop")
    localStorage.setItem("previewMode", qsMode);
  const savedMode = localStorage.getItem("previewMode");
  const forceMobile = savedMode === "mobile";
  const forceDesktop = savedMode === "desktop";

  // QR + Whats + Copiar
  if (qr)
    qr.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
      encodeURIComponent(url);
  if (waBtn)
    waBtn.href =
      "https://wa.me/?text=" +
      encodeURIComponent("Hola, ábrelo en mi celular: " + url);
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(url);
      copyBtn.textContent = "¡Copiado!";
      setTimeout(() => (copyBtn.textContent = "Copiar enlace"), 1500);
    });
  }

  function evaluate() {
    let showApp;
    if (forceMobile) showApp = true;
    else if (forceDesktop) showApp = false;
    else showApp = !isDesktopLike();
    setVisible(showApp);
  }

  evaluate();

  let rid;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(rid);
    rid = requestAnimationFrame(evaluate);
  });
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
  const START_AT = 6;

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

  // === Cambiado: esperar a que termine el intro antes de reproducir la música ===
  async function tryAutoplay() {
    const introC = document.getElementById("intro-video-container");
    const introVisible = introC && introC.style.display !== "none";

    if (introVisible) {
      setPauseIcon(true);
      document.addEventListener(
        "intro:ended",
        async () => {
          try {
            // quitar mute aplicado durante el intro
            try {
              audio.muted = false;
            } catch {}
            await primeAndPlay(START_AT);
          } catch {}
        },
        { once: true }
      );
      return; // no reproducir aún
    }

    // Si no hay intro visible, seguimos igual que antes
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
(() => {
  const icons = Array.from(
    document.querySelectorAll(".prog-timeline .prog-ico")
  );
  if (icons.length < 1) return;

  let idx = -1; // índice actual
  let dir = 1; // 1: hacia abajo | -1: hacia arriba
  const speed = 900; // ms entre cambios
  let paused = false; // para pausar cuando la pestaña no está visible

  function paint() {
    icons.forEach((el) => el.classList.remove("is-on"));
    icons[idx]?.classList.add("is-on");
  }

  function step() {
    if (paused) {
      // no avances mientras esté oculta la pestaña
      setTimeout(step, speed);
      return;
    }

    idx += dir;

    // Rebote (1→N→1…)
    if (idx >= icons.length) {
      dir = -1;
      idx = icons.length - 2;
    } else if (idx < 0) {
      dir = 1;
      idx = 1;
    }

    paint();
    setTimeout(step, speed);
  }

  // Arranca encendiendo el primero
  idx = 0;
  paint();
  setTimeout(step, speed);

  // Pausa/resume cuando cambie visibilidad de la pestaña
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
  });

  // Respeta accesibilidad
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    icons.forEach((el) => el.classList.add("is-on")); // sin animación
  }
})();

// ==== Modal de Google Maps / Waze (Recepción + Ceremonia) ====
(function () {
  const modal = document.getElementById("mapModal");
  const btnRecepcion = document.getElementById("btnMapaRecepcion");
  const btnCeremonia = document.getElementById("btnMapaCeremonia");

  const btnClose = document.getElementById("mapModalClose");
  const backdrop = document.getElementById("mapModalBackdrop");
  const btnMaps = document.getElementById("mapModalMaps");
  const btnWaze = document.getElementById("mapModalWaze");

  if (!modal || !btnMaps || !btnWaze) return;

  const openModal = () => modal.classList.add("is-open");
  const closeModal = () => modal.classList.remove("is-open");

  btnClose?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  // función que configura los links según de dónde venga (recepción / ceremonia)
  function configurarLinks(tipo) {
    if (tipo === "recepcion") {
      // 👉 GOOGLE MAPS: usa exactamente el link que tienes en WhatsApp
      btnMaps.onclick = () => {
        window.open(
          "https://maps.app.goo.gl/LUXP5rXH8cxzmnhCA?g_st=aw",
          "_blank"
        );
        closeModal();
      };

      // 👉 WAZE: búsqueda directa del salón con navegación
      btnWaze.onclick = () => {
        const wazeUrl =
          "https://waze.com/ul?q=" +
          encodeURIComponent(
            "Salones Palazzio Videmar, Manuel González 71, Ex Hipódromo de Peralvillo, Cuauhtémoc, Ciudad de México, CDMX"
          ) +
          "&navigate=yes";

        window.open(wazeUrl, "_blank");
        closeModal();
      };
    }

    if (tipo === "ceremonia") {
      // 👉 GOOGLE MAPS (tu link exacto)
      btnMaps.onclick = () => {
        window.open("https://maps.app.goo.gl/dMMmgYUSe3YkB8MQ6", "_blank");
        closeModal();
      };

      // 👉 WAZE (búsqueda por nombre/dirección)
      btnWaze.onclick = () => {
        const wazeUrl =
          "https://waze.com/ul?q=" +
          encodeURIComponent(
            "Parroquia de María Auxiliadora, Colegio Salesiano #61, Anáhuac I Secc, Miguel Hidalgo, CDMX"
          ) +
          "&navigate=yes";

        window.open(wazeUrl, "_blank");
        closeModal();
      };
    }
  }

  // botón Recepción
  if (btnRecepcion) {
    btnRecepcion.addEventListener("click", () => {
      configurarLinks("recepcion");
      openModal();
    });
  }

  // botón Ceremonia
  if (btnCeremonia) {
    btnCeremonia.addEventListener("click", () => {
      configurarLinks("ceremonia");
      openModal();
    });
  }
})();
// ==== Modal: ¿Hasta qué hora es la fiesta? ====
(function () {
  const modal = document.getElementById("horaModal");
  const btnOpen = document.getElementById("btnHoraFiesta"); // este botón lo creamos abajo
  const btnClose = document.getElementById("horaModalClose");
  const backdrop = document.getElementById("horaModalBackdrop");

  if (!modal || !btnOpen) return;

  const openModal = () => modal.classList.add("is-open");
  const closeModal = () => modal.classList.remove("is-open");

  btnOpen.addEventListener("click", openModal);
  btnClose.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
})();
