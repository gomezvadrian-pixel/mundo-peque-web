# Procedimiento seguro de integración (preview → master)

## Regla de oro
La región de la videoteca en `~/workspace/web-v3/index.html` (entre
`<!-- VIDEOTECA-AUTO:INICIO -->` y `<!-- VIDEOTECA-AUTO:FIN -->`)
**nunca es la fuente de los datos reales**: la reescribe a diario el
workflow `actualizar-youtube.yml`. Copiar `index.html` desde la carpeta
de edición sin tener esto en cuenta publicó una vez datos de ejemplo
en producción.

## Protecciones automáticas (ya activas)
- `scripts/sync_youtube.py`: en modo prueba (`--test` / sin API key)
  solo valida la generación y **no toca ningún archivo**.
- `assert_no_fixture()`: aborta antes de escribir si aparece un ID
  ficticio; `MIN_TARJETAS = 12`: aborta si la API devuelve muy pocos
  vídeos. En ambos casos se conservan los últimos datos reales.
- El workflow tiene el paso `Verificar datos reales`: si detecta IDs
  ficticios en `index.html` o los JSON, **falla y detiene el despliegue**.

## Pasos para integrar preview-actividades en master
1. La protección debe estar en **ambas** ramas (script + workflow).
2. Lanzar el workflow `Actualizar videoteca` con `workflow_dispatch`
   sobre `preview-actividades` para que su videoteca tenga datos reales.
3. Fusionar con `git merge --no-commit origin/preview-actividades`.
4. **Antes de completar el merge**, ejecutar:
   `grep -qE 'abc123XYZ_-|def456UVW_-|trampa01H_-' index.html && echo "HAY FICTICIOS: no publicar" || echo "OK: sin ficticios"`
   (lista completa en `FIXTURE_IDS` dentro del script).
   Si hay ficticios: `git merge --abort` y revisar.
5. Completar el merge, publicar y verificar `mundopequeconcalma.com`:
   miniaturas reales y enlaces de YouTube válidos.

## En caso de incidencia
- Referencia recuperable: tag `pre-videoteca-fix-2026-10-12`.
- Si la videoteca publica datos de ejemplo: lanzar `workflow_dispatch`
  de `Actualizar videoteca` sobre `master`; el sync la regenera con
  datos reales.
