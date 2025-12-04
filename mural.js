// === CONFIG: URL de tu Apps Script ===
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxVvqJGcSLUbWDWxzdOdcdv4AJhKCXNoGjVaxE3Xkq3DM9z7xy7xQ5lS76bjEP997bE9Q/exec";

// === Referencias a elementos del DOM ===
const camaraBtn = document.getElementById("btnCamara");
const galeriaBtn = document.getElementById("btnGaleria");
const inputCamara = document.getElementById("archivoCamara");
const inputGaleria = document.getElementById("archivoGaleria");
const estado = document.getElementById("estado");
const grid = document.getElementById("galeriaGrid");
const emptyMsg = document.getElementById("galeriaEmpty");

// === Listeners de botones ===
if (camaraBtn && inputCamara) {
  camaraBtn.addEventListener("click", () => inputCamara.click());
}
if (galeriaBtn && inputGaleria) {
  galeriaBtn.addEventListener("click", () => inputGaleria.click());
}

if (inputCamara) {
  inputCamara.addEventListener("change", () => {
    if (!inputCamara.files.length) return;
    subirFotos(inputCamara.files);
  });
}

if (inputGaleria) {
  inputGaleria.addEventListener("change", () => {
    if (!inputGaleria.files.length) return;
    subirFotos(inputGaleria.files);
  });
}

// === Subir foto al Apps Script ===
function subirFotos(files) {
  const file = files[0];
  if (!file) return;

  if (estado) estado.textContent = "Subiendo foto...";

  const reader = new FileReader();

  reader.onloadend = () => {
    const base64 = reader.result.split(",")[1];

    fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "save",
        image: base64,
        name: file.name,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          console.error(data.error);
          if (estado)
            estado.textContent = "Error al subir la foto 😔 intenta de nuevo.";
          return;
        }

        if (estado)
          estado.textContent = data.message || "¡Foto subida al mural! 🥰";
        cargarGaleria();
      })
      .catch((err) => {
        console.error(err);
        if (estado)
          estado.textContent = "Error al subir la foto 😔 intenta de nuevo.";
      });
  };

  reader.readAsDataURL(file);
}

// === Cargar galería desde Apps Script ===
function cargarGaleria() {
  if (estado) estado.textContent = "Cargando galería...";

  fetch(SCRIPT_URL + "?action=list")
    .then((res) => res.json())
    .then((data) => {
      grid.innerHTML = "";

      if (!data.ok || !data.files || data.files.length === 0) {
        if (emptyMsg) emptyMsg.hidden = false;
        if (estado) estado.textContent = "";
        return;
      }

      if (emptyMsg) emptyMsg.hidden = true;
      if (estado) estado.textContent = "";

      data.files.forEach((f) => {
        const div = document.createElement("div");
        div.className = "mural-item";

        const img = document.createElement("img");
        img.src = f.url;
        img.alt = f.name || "Foto del evento";

        div.appendChild(img);
        grid.appendChild(div);
      });
    })
    .catch((err) => {
      console.error(err);
      if (estado) estado.textContent = "No se pudo cargar la galería 😔";
    });
}

// Cargar fotos al entrar a la página
document.addEventListener("DOMContentLoaded", cargarGaleria);
