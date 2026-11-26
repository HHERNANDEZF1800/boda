/* ==========================================================================
   CONFIGURACIÓN DE LA BODA
   Todo el contenido editable vive aquí. Cambia textos, fechas y fotos
   sin tocar el resto del código.
   ========================================================================== */
window.BODA = {
  novios: {
    el: "Héctor",
    ella: "Nombre de ella",      // TODO: nombre de tu novia
    iniciales: "H & N",
  },

  // Fecha y hora de la ceremonia (formato ISO, hora local)
  fecha: "2027-06-12T17:00:00",       // TODO
  fechaTexto: "Sábado 12 de junio de 2027",

  frase: "Y en medio de todo, nos encontramos.",

  /* ---------------- Historia (capítulos) ----------------
     Cada capítulo aparece en la sección "Nuestra historia".
     foto: ruta a la imagen (reemplaza ejemplo-N.svg por tus fotos .jpg) */
  historia: [
    {
      fecha: "2019",
      titulo: "Cómo nos conocimos",
      texto:
        "Aquí va el inicio de nuestra historia: el lugar, el momento y esa primera impresión que ninguno de los dos olvida. Este texto es de ejemplo y lo cambiaremos después.",
      foto: "assets/img/ejemplo-1.svg",
    },
    {
      fecha: "2020",
      titulo: "Nuestra primera cita",
      texto:
        "La primera cita, los nervios, la plática que se alargó hasta tarde y la certeza de que habría una segunda.",
      foto: "assets/img/ejemplo-2.svg",
    },
    {
      fecha: "2022",
      titulo: "Aventuras juntos",
      texto:
        "Viajes, mudanzas, risas y días difíciles que nos hicieron más fuertes. Cada paso, de la mano.",
      foto: "assets/img/ejemplo-3.svg",
    },
    {
      fecha: "2026",
      titulo: "La propuesta",
      texto:
        "Y un día, con el corazón acelerado, llegó la pregunta. La respuesta ya la saben.",
      foto: "assets/img/ejemplo-4.svg",
    },
  ],

  // Capítulo especial para la perrita
  mascota: {
    nombre: "Nombre de la perrita",   // TODO
    titulo: "Y la familia creció",
    texto:
      "Ella llegó a nuestras vidas para enseñarnos que el amor también se mide en patitas. Experta en siestas, cobijas y en robarse el corazón de todos. Por supuesto, estará presente en este gran día.",
    foto: "assets/img/perrita.jpg",
  },

  /* ---------------- El gran día ---------------- */
  eventos: [
    {
      tipo: "Ceremonia religiosa",
      hora: "17:00 h",
      lugar: "Parroquia de Ejemplo",          // TODO
      direccion: "Calle, número, colonia, ciudad",
      mapa: "https://maps.google.com/?q=Parroquia",
    },
    {
      tipo: "Recepción",
      hora: "19:30 h",
      lugar: "Jardín de Ejemplo",             // TODO
      direccion: "Calle, número, colonia, ciudad",
      mapa: "https://maps.google.com/?q=Jardin",
    },
  ],

  vestimenta: {
    codigo: "Formal",
    nota: "Te sugerimos tonos de nuestra paleta. Por favor reserva el blanco y marfil para la novia.",
  },

  galeria: [
    "assets/img/ejemplo-5.svg",
    "assets/img/ejemplo-6.svg",
    "assets/img/ejemplo-7.svg",
  ],

  /* ---------------- Música ----------------
     Si pones un archivo (ej. "assets/audio/cancion.mp3") se reproduce en loop.
     Si se deja vacío, suena una melodía ambiental generada en el navegador. */
  musica: "",

  /* ---------------- RSVP / Google Sheets ----------------
     Pega aquí la URL del Web App de Apps Script (ver apps-script/LEEME.md).
     Mientras esté vacío, la página funciona en MODO DEMO con los códigos
     de abajo y guarda las respuestas sólo en este navegador. */
  rsvpEndpoint: "",
  fechaLimiteRsvp: "1 de mayo de 2027",
  maxExtras: 4, // máximo de personas adicionales que se pueden solicitar

  demoInvitados: {
    DEMO01: { nombre: "Familia Ejemplo", pases: 2 },
    DEMO02: { nombre: "Juan Pérez", pases: 2 },
  },
};
