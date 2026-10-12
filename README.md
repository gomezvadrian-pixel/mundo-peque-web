# Mundo Peque – Con Calma · web

## Ver la web
Abre `index.html` en tu navegador. No necesita servidor: todo funciona en local.

## Qué incluye
- Portada con héroe, 6 tarjetas de series (enlazan a búsquedas y listas reales de YouTube).
- Los 18 personajes con fotografías originales en `assets/` (Nico y Sira en la raíz de assets, el resto en `assets/personajes/`). Si una foto no carga, aparece un aviso honesto; nunca un personaje inventado.
- Vídeos reales con miniatura local en `assets/thumbs/`: 3 historias, 3 shorts y 3 ambientes para relajarse, cada uno con su enlace verificado a YouTube.
- Especial de temporada: Halloween 2026 («Mundo Peque se disfraza») con la foto de Pau y enlaces a los 5 vídeos.
- Secciones Cuentos (preparada para la futura venta de cuentos y cuadernillos: estado «Muy pronto», sin precios ni compra simulada), Sobre Mundo Peque y Contacto con redes.
- Páginas legales: `privacidad.html`, `cookies.html`, `aviso-legal.html` (borradores honestos; revisar con asesoría antes de vender).

## Publicación (plan)
1. Subir esta carpeta a un repositorio de GitHub.
2. Desplegar en Cloudflare Pages (conectar el repositorio; directorio de salida: la raíz).
3. En OVHcloud, apuntar `mundopequeconcalma.com` y `mundopequeconcalma.es` al despliegue de Cloudflare.

## Pendiente / ideas futuras
- Fichas individuales por personaje (personalidad, actividades favoritas).
- Página «El pueblo de Mundo Peque» y archivo de temporadas.
- Tienda real de cuentos y cuadernillos cuando estén listos (el primero: Halloween).

## Fichas de personaje
Al tocar un personaje se abre su ficha con sus vídeos (mapeados automáticamente
desde la videoteca + especiales de Halloween) y su sección de wallpapers.
Para añadir wallpapers de un personaje: guarda las imágenes en
`assets/wallpapers/<id>/` (p. ej. `assets/wallpapers/nico/nico-1.jpg`, id en
minúsculas sin tildes) y añádelas en `script.js` al objeto WALLPAPERS:
`'Nico': [{src:'assets/wallpapers/nico/nico-1.jpg', alt:'Nico en el bosque'}]`.
Aparecen solas en la ficha, con botón de descarga.

## Actualización automática de la videoteca

El workflow `.github/workflows/actualizar-youtube.yml` se ejecuta cada mañana
(05:00 UTC) y lanza `scripts/sync_youtube.py`, que:

1. Lee las últimas subidas del canal vía YouTube Data API v3 (cuesta ~3 unidades
   de cuota al día).
2. Clasifica cada vídeo por serie según su título (las plantillas fijas:
   «La receta de» → Cocina, «Sira crea» → Creación, «El momento de» →
   Autocuidado, «en casa:» → Hogar cozy, «se duerme» → Dormir,
   «descubre:» → Descubre; «se disfraza» se excluye, va en el bloque
   especial de Halloween que es manual).
3. Separa largos y shorts por duración (menos de 1:50 = Short, el resto = largo).
4. Elige los 2 más recientes de cada serie y formato y regenera las tarjetas
   en `index.html` (solo entre las marcas `VIDEOTECA-AUTO`).
5. Si hay cambios, hace commit y push; Cloudflare redespliega solo.

Requiere el secreto `YOUTUBE_API_KEY` en el repositorio (Settings → Secrets
and variables → Actions). Las fichas de personaje («Sus vídeos») siguen siendo
selección manual.
