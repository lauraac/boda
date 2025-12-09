// PON AQUÍ LA URL DE TU WEB APP DE APPS SCRIPT
const API_URL =
  "https://script.google.com/macros/s/AKfycbxVvqJGcSLUbWDWxzdOdcdv4AJhKCXNoGjVaxE3Xkq3DM9z7xy7xQ5lS76bjEP997bE9Q/exec";

document.addEventListener("DOMContentLoaded", () => {
  const btnCamara = document.getElementById("btnCamara");
  const btnGaleria = document.getElementById("btnGaleria");
  const inputCamara = document.getElementById("archivoCamara");
  const inputGaleria = document.getElementById("archivoGaleria");
  const estado = document.getElementById("estado");

  // Cargar mural al entrar
  cargarGaleria();

  // BOTÓN CÁMARA (toma foto)
  btnCamara.addEventListener("click", () => {
    inputCamara.click();
  });

  inputCamara.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    estado.textContent = "Subiendo foto de cámara...";
    try {
      await subirImagen(file);
      estado.textContent = "📸 Foto subida correctamente";
      inputCamara.value = "";
      await cargarGaleria();
    } catch (err) {
      console.error(err);
      estado.textContent = "Ocurrió un error al subir la foto 😢";
    }
  });

  // BOTÓN GALERÍA (múltiples fotos)
  btnGaleria.addEventListener("click", () => {
    inputGaleria.click();
  });

  inputGaleria.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    estado.textContent = "Subiendo fotos de galería...";
    try {
      for (const file of files) {
        await subirImagen(file);
      }
      estado.textContent = "🖼️ Fotos subidas correctamente";
      inputGaleria.value = "";
      await cargarGaleria();
    } catch (err) {
      console.error(err);
      estado.textContent = "Ocurrió un error al subir las fotos 😢";
    }
  });

  // Función: carga lista de imágenes desde Apps Script
  async function cargarGaleria() {
    const grid = document.getElementById("galeriaGrid");
    const emptyMsg = document.getElementById("galeriaEmpty");

    grid.innerHTML = "";
    emptyMsg.hidden = true;
    estado.textContent = "Cargando mural...";

    try {
      const res = await fetch(`${API_URL}?action=list`);
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Error en la respuesta");

      const fotos = data.images || [];

      if (!fotos.length) {
        emptyMsg.hidden = false;
        estado.textContent = "";
        return;
      }

      fotos.forEach((url) => {
        const div = document.createElement("div");
        div.className = "mural-item";

        const img = document.createElement("img");
        img.src = url;
        img.alt = "Foto del evento";
        div.appendChild(img);

        grid.appendChild(div);
      });

      estado.textContent = "";
    } catch (err) {
      console.error(err);
      estado.textContent = "No se pudieron cargar las fotos 😢";
    }
  }

  // Función: convierte archivo en base64 y lo manda a Apps Script
  async function subirImagen(file) {
    const base64 = await fileToBase64(file); // data:image/...;base64,XXXX
    const soloBase64 = base64.split(",")[1]; // Quitamos "data:image/..."

    const body = {
      image: soloBase64,
      filename: file.name || "foto_evento.jpg",
      type: file.type || "image/jpeg",
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error || "Error al subir imagen");
    }
  }

  // Helper: archivo → base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
});
