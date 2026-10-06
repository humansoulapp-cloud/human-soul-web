# Responsive: escritorio y móvil

Punto de corte único: **768px**. Por debajo, móvil; desde 768px, escritorio. Diseña y revisa a 1440px y a 390px.

| Elemento | Escritorio (≥ 768px) | Móvil (< 768px) |
| --- | --- | --- |
| Navegación | `Sidebar` flotante de 256px a la izquierda, con «Escribir», modo claro/oscuro y cerrar sesión abajo | `BottomNav` fija abajo con 5 ítems (Inicio, Reflexiones, Viajes, Favoritas, Perfil); «Escribir» pasa a un botón flotante `Button size="fab"`; modo oscuro, cerrar sesión y el acceso al panel de administración viven en Perfil |
| Contenido | Margen izquierdo de 304px (256 + 16 + 32), derecho `space-6` | Margen lateral `space-4`, 88px de aire abajo por la barra |
| Modal | `Dialog` centrado, 448px | `Sheet` anclada abajo, ancho completo, botones apilados a ancho completo |
| Tabla | `DataList` como tabla | `DataList` como pila de tarjetas con acciones al pie |
| Rejillas | 2 o 3 columnas (`space-5` de separación) | 1 columna (`space-3`) |
| Pestañas y filtros | `Tabs` en una fila | `Tabs` con scroll horizontal, sin barra visible |
| Formularios | Columna de máximo 672px centrada | Ancho completo, botón principal a ancho completo |

## Administración
El panel de administración usa los mismos tokens y componentes que el resto de la app (sin paleta propia). En escritorio lleva su `Sidebar` con «Panel de administración», «Viajes» y «Usuarios». En móvil la navegación es un menú en `Sheet` abierto desde un botón de menú en la cabecera.

## Reglas
- Un objetivo táctil nunca baja de 44px.
- El contenido no desborda en horizontal: lo ancho (tablas, pestañas) tiene su propio scroll o se convierte en tarjetas.
- Respeta las áreas seguras del dispositivo en la barra inferior.
