HumanSoul es un diario personal y una colección de viajes guiados. El sistema transmite calma: papel cálido, salvia, titulares serif y mucho aire. Todo el contenido visible va en español, en tono sereno.

## Fundamentos de contenido

- Habla de tú, en frases cortas y tranquilas. Sin exclamaciones, sin emoji, sin urgencia. Ejemplos de la marca: «Un lugar tranquilo para notarte.», «Sin rachas. Sin puntuaciones. Sin presión.», «Privado por defecto.», «Cuando estés listo.»
- No introduzcas rachas, puntuaciones, insignias ni contadores de constancia. El onboarding promete lo contrario.
- Usa mayúscula solo al inicio de frase («Guardar reflexión», no «Guardar Reflexión»).
- Los botones dicen lo que ocurre: verbo + objeto («Crear cuaderno», «Escribir reflexión», «Publicar ahora»). Evita «Aceptar» y «Enviar».
- Los errores explican qué pasó y qué hacer, sin disculpas: «No se pudo guardar. Comprueba tu conexión e inténtalo otra vez.»
- Vocabulario fijo: **Cuaderno** (agrupa reflexiones), **Reflexión** (una entrada), **Viaje** (recorrido guiado de varios días), **Favoritas**. No mezcles «diario», «journal» ni «journey».
- Fechas en formato largo y local («12 de septiembre de 2026»); en tablas y tarjetas compactas, «12 sep 2026».

## Fundamentos visuales

- **Color.** Fondo de página con `background`, texto con `foreground`, texto secundario con `muted-foreground`. Superficies elevadas con `card` y flotantes con `popover`. La acción principal es siempre `primary` con texto `primary-foreground`; no lo uses para decorar. `brand` (salvia de marca) solo rellena formas decorativas y nunca lleva texto sobre `background` en claro.
- **Estados.** Error con `destructive` y `destructive-soft`, éxito con `success` y `success-soft`, pendiente con `warning` y `warning-soft`, información o borrador con `info` e `info-soft`. Todo estado lleva icono o palabra, nunca solo color.
- **Resaltado.** `accent` con `accent-foreground` marca el ítem activo, la fila en hover y el chip o pestaña al pasar el cursor.
- **Tipografía.** Titulares en Bernstein (`text-display`, `text-h1` a `text-h4`), siempre en peso 400. Cuerpo en Inter: `text-body` por defecto, `text-body-lg` para escribir y leer reflexiones, `text-body-sm` para ayudas y fechas. `text-caption` y `text-overline` (12px) solo para contadores, badges y categorías. El texto corrido no baja de 14px. DM Sans solo aparece en el wordmark.
- **Espaciado.** Escala `space-1` a `space-8` (4 a 64px). Relleno de tarjeta: `space-4` en móvil, `space-5` desde 640px. Margen lateral de página: `space-4` en móvil, `space-6` en escritorio.
- **Radios.** Campos y botones `radius-md`; tarjetas `radius-lg`; sheets, diálogos y barra lateral `radius-xl`; chips, avatares y badges `radius-full`.
- **Sombras.** `shadow-sm` en tarjetas, `shadow-md` en hover, `shadow-lg` en diálogos y sheets. Los bordes usan `border`; los controles usan `input`.
- **Foco.** Anillo sólido de 2px en `ring` con 2px de separación en todo elemento interactivo. No lo quites.
- **Táctil.** Todo control mide al menos 44px de alto; los ítems de navegación inferior, 52px.
- **Movimiento.** Transiciones de 150ms en color, borde y sombra. Respeta `prefers-reduced-motion`: sin giros ni pulsos.
- **Imágenes.** Portadas de viaje en proporción 16:10 sobre la tarjeta, nunca con texto encima. Fotos de reflexión con `radius-md` y 240px de alto máximo.
- **Temas.** Claro y oscuro con los mismos nombres de token. Todo texto cumple 4,5:1 sobre las superficies que su nota indica, en ambos temas. En claro `primary` es una salvia profunda; en oscuro es la salvia de marca con texto oscuro.

## Iconografía

Iconos de trazo de lucide (24px de rejilla, trazo 2, extremos redondeados), disponibles por nombre en `Icon`. Tamaño base 20px; 16px dentro de chips y badges; 28px dentro de estados vacíos. Heredan el color del texto (`currentColor`). No uses emoji ni iconos rellenos, salvo el corazón de favorita, que se rellena al activarse.

## Marca

El wordmark es «Human» en DM Sans 500 más «Soul» en Bernstein, en una sola línea, con `foreground`. Usa el componente `Logo`. El archivo `assets/Logos/logo.svg` es la marca original en tinta oscura: úsala solo sobre fondos claros; sobre fondos oscuros usa `Logo`.

## Cómo construir

- Usa solo tokens y componentes de este sistema. No introduzcas colores, radios ni tamaños sueltos.
- Escritorio: barra lateral (`Sidebar`). Móvil: navegación inferior (`BottomNav`). Tablas pasan a tarjetas (`DataList`) y modales a sheets (`Sheet`). Ver «Responsive».
- Toda pantalla que consulta datos define sus cuatro estados: con datos, cargando (`Skeleton`), vacío (`EmptyState`) y error (`ErrorState`). Ver «Estados».
