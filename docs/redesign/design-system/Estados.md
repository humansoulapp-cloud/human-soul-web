# Estados de pantalla

Toda pantalla que lee datos de Supabase resuelve cuatro estados. Ninguno se deja a medias.

| Estado | Componente | Regla |
| --- | --- | --- |
| Con datos | La tarjeta o tabla de la pantalla | Estado por defecto. |
| Cargando | `Skeleton` con la forma del contenido | Sin texto «Cargando…». Mismas dimensiones que el contenido final para evitar saltos. |
| Vacío | `EmptyState` | Dice qué falta y ofrece la primera acción. El vacío de una búsqueda sin resultados es distinto del vacío «aún no hay nada». |
| Error | `ErrorState` o `Alert variant="destructive"` | `ErrorState` cuando falla toda la carga; `Alert` cuando falla una acción (guardar, borrar). Siempre con «Reintentar». |

## Estados de control
Todo control documenta: reposo, hover, foco, deshabilitado, error y cargando (donde aplica). El estado de carga de un botón mantiene su texto y muestra un spinner; no cambia el ancho.

## Mensajes de ejemplo
- Vacío de reflexiones: «Aún no hay reflexiones. Dedica unos minutos a escribir lo que tienes en mente.»
- Vacío de favoritas: «Todavía no has marcado ninguna favorita. Toca el corazón en cualquier entrada para guardarla aquí.»
- Vacío de búsqueda: «Nada coincide con “calma”. Prueba con otra palabra o etiqueta.»
- Error de carga: «No hemos podido cargar tus reflexiones. Revisa tu conexión e inténtalo de nuevo.»
- Error de guardado: «No se pudo guardar tu reflexión. Tu texto sigue aquí; inténtalo otra vez.»
