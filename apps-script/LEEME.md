# Conectar el RSVP con Google Sheets

1. Crea una hoja nueva en Google Sheets (por ejemplo "Boda – RSVP").
2. Menú **Extensiones → Apps Script**. Borra lo que haya y pega el contenido de `Code.gs`.
3. En el editor elige la función **`setup`** y pulsa **Ejecutar** (autoriza los permisos).
   Se crean las hojas `Invitados`, `Respuestas` y `Extras` con dos invitados de ejemplo.
4. Captura a tus invitados en `Invitados` (Nombre y Pases; deja el Código vacío)
   y ejecuta **`generarCodigosFaltantes`** para crear un código único para cada uno.
   - `Pases = 2` → la persona + 1 (valor por defecto)
   - `Pases = 1` → pase individual, `Pases = 4` → familia de 4, etc.
5. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copia la URL que termina en `/exec` y pégala en `js/config.js` → `rsvpEndpoint`.

Cada vez que modifiques `Code.gs` hay que crear una **nueva versión** de la implementación
(Implementar → Gestionar implementaciones → editar → Versión nueva). Si no, la URL sigue
ejecutando el código anterior.

## Solicitudes de personas adicionales
Llegan a la hoja `Extras` con estado **Pendiente**. Cámbialo a **Aprobado** o **Rechazado**.
Cuando el invitado vuelva a abrir su código verá el estado de cada persona.

## Liga directa por invitado (opcional)
`https://tu-dominio.com/?codigo=AB12CD` abre el modal con el código ya escrito.
Sirve para mandarla por WhatsApp o ponerla en un QR.
