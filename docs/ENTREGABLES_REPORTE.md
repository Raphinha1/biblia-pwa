# Reporte de Entregables del Laboratorio: Buscador de la Biblia (PWA)

**Proyecto:** `biblia-pwa` (Reina-Valera 1960)  
**Arquitectura:** Vanilla JavaScript (ES Modules), Service Worker (`cache-first` + `stale-while-revalidate`), Web App Manifest  
**Fuente de Datos:** API REST pública `https://bolls.life` (`RV1960`)

---

## 1. Actividad de Exploración de la API (`bolls.life`)

Durante la inspección técnica de los endpoints de `https://bolls.life` para la traducción **RV1960**, se documentaron los siguientes hallazgos clave que guiaron el diseño de `js/api.js` y `js/lib.js`:

1. **Conteo de versículos en Juan 3 (`/get-text/RV1960/43/3/`):**
   - El capítulo 3 del Evangelio de Juan (`bookId = 43`, `chapter = 3`) devuelve un arreglo JSON con exactamente **36 objetos** (`verse: 1` hasta `verse: 36`).

2. **Diferencia estructural entre `get-text` y `get-verse`:**
   - **`/get-text/RV1960/43/3/` (Capítulo completo):** Devuelve un **arreglo JSON (`Array`)** donde cada elemento representa un versículo con las propiedades `{ pk, verse, text }`:
     ```json
     [
       { "pk": 15001, "verse": 1, "text": "Había un hombre de los fariseos..." },
       { "pk": 15002, "verse": 2, "text": "Este vino a Jesús de noche..." }
     ]
     ```
   - **`/get-verse/RV1960/43/3/16/` (Versículo individual):** Devuelve un **objeto JSON único (`Object`)** (aunque en algunas versiones/endpoints de la API puede envolverse en un arreglo de 1 elemento, razón por la cual `getVerse()` normaliza la respuesta con `Array.isArray(data) ? data[0] : data`), e incluye metadatos adicionales como `translation`, `book` y `chapter`:
     ```json
     {
       "pk": 15016,
       "translation": "RV1960",
       "book": 43,
       "chapter": 3,
       "verse": 16,
       "text": "Porque de tal manera amó Dios al mundo..."
     }
     ```

3. **Etiquetas HTML e impurezas en el campo `text`:**
   - El campo `text` devuelto por la API no es texto plano; viene contaminado con marcado HTML y anotaciones léxicas que deben limpiarse antes de renderizarse:
     - **`<br>` / `<br/>`:** Saltos de línea poéticos o estructurales que pegarían palabras si se eliminan sin reemplazarse por espacio.
     - **`<i>...</i>`:** Palabras añadidas por los traductores para completar el sentido en español (cursivas).
     - **`<S>...</S>`:** Números de concordancia de Strong incrustados (p. ej. `<S>H430</S>`), los cuales deben suprimirse junto con su contenido numérico mediante la expresión regular `/<S>.*?<\/S>/gi`.
     - **Entidades HTML (`&nbsp;`, `&amp;`, `&lt;`, `&gt;`):** Espacios de no separación y símbolos escapados.

4. **Comportamiento ante capítulos inexistentes (`/get-text/RV1960/43/99/`):**
   - Al consultar un capítulo fuera de rango como `43/99/`, el servidor de `bolls.life` **no devuelve un error HTTP 404**, sino una respuesta **HTTP `200 OK` con un arreglo vacío `[]`**.
   - Por esta razón, en `js/api.js` no basta con verificar `if (!res.ok)`; es indispensable validar explícitamente `if (!Array.isArray(data) || data.length === 0) throw new Error("Capítulo vacío o inexistente.")`, además de validar previamente el límite de capítulos por libro en `parseReference()`.

---

## 2. Tabla de Pruebas Funcionales (Sección 7.1)

Todas las pruebas funcionales del laboratorio fueron verificadas sobre el proyecto:

| # | Entrada / acción | Resultado esperado | OK | Observación |
|:-:|------------------|--------------------|:--:|-------------|
| 1 | `Juan 3:16` | Capítulo Juan 3 completo; versículo 16 resaltado y centrado en pantalla | ☑ | Carga los 36 versículos, aplica clase `.sel` al versículo 16 y ejecuta `scrollIntoView({ behavior: "smooth", block: "center" })`. |
| 2 | `jn 3` | Mismo capítulo sin resaltar ningún versículo | ☑ | Reconoce el alias `"jn"` (`id: 43`), `selStart` y `selEnd` quedan en `null` y muestra el capítulo íntegro. |
| 3 | `1 Corintios 13:4-7` | Capítulo 13 con los versículos 4 a 7 resaltados; el título dice «1 Corintios 13:4-7» | ☑ | `formatRef` genera el encabezado exacto y se resaltan los 4 versículos del rango. |
| 4 | `genesis 1` (sin acento) | Carga Génesis 1 | ☑ | `normalize()` aplica descomposición Unicode `NFD` y remueve diacríticos antes de buscar en `INDEX`. |
| 5 | `Sal 23` | Carga Salmos 23 | ☑ | Resuelve mediante el alias `"sal"` hacia `id: 19` (Salmos, capítulo 23). |
| 6 | `Apoc 22:21` | Resuelve «Apoc» como Apocalipsis por prefijo único | ☑ | Al tener longitud $\ge 3$ y ser prefijo único de `"apocalipsis"`, `findBook` retorna `id: 66`. |
| 7 | `Juan 22` | Mensaje: «Juan tiene 21 capítulos.» y no se hace petición a la API | ☑ | Validación preventiva en `parseReference`; bloquea el `fetch` innecesario y anuncia el error con `role="alert"`. |
| 8 | `Foo 3` | Mensaje: «No reconozco el libro «Foo».» | ☑ | `findBook("Foo")` retorna `null` y se informa al usuario sin alterar el estado previo. |
| 9 | `Juan` (sin capítulo) | Mensaje con ejemplos de formato válido | ☑ | No coincide con la expresión regular de referencia; muestra guía de sintaxis clara. |
| 10 | Selectores: Salmos → Capítulo 119 → Ver capítulo | Carga Salmos 119 (176 versículos) con desplazamiento fluido | ☑ | `fillChapters` genera dinámicamente los 150 capítulos de Salmos; renderiza los 176 versículos de Salmos 119 al instante. |
| 11 | Génesis 50 → botón ▶ | Pasa a Éxodo 1 | ☑ | `step(1)` detecta `chapter > 50`, avanza a `BOOKS[1]` (Éxodo) e inicializa `chapter = 1`. |
| 12 | Éxodo 1 → botón ◀ | Regresa a Génesis 50 | ☑ | `step(-1)` detecta `chapter < 1`, retrocede a `BOOKS[0]` (Génesis) y posiciona `chapter = 50`. |
| 13 | Apocalipsis 22 → ▶ | No pasa del último libro (se queda en Apocalipsis 22) | ☑ | `Math.min(BOOKS.length - 1, ...)` protege el límite superior canónico y recarga Apocalipsis 22:1 / cap 22 sin desbordamiento. |
| 14 | Botones `A+` / `A−` | El tamaño cambia y se mantiene entre 0.8 y 2.2 rem | ☑ | `setFs` acota el valor con `Math.min(2.2, Math.max(0.8, v))` y actualiza la variable CSS `--fs`. |
| 15 | Clic en un versículo | Se resalta; segundo clic lo desmarca | ☑ | Alterna `state.selStart` / `state.selEnd` entre el número de versículo `n` y `null`, actualizando también el título. |
| 16 | Presentar con un versículo seleccionado | Pantalla completa mostrando solo ese versículo con su referencia | ☑ | Filtra `state.pList` al rango activo, abre `#presenter`, solicita `requestFullscreen()` y activa `navigator.wakeLock`. |
| 17 | Presentar sin selección; flechas ← →, espacio y Esc | Navega todo el capítulo; Esc cierra y sale de pantalla completa | ☑ | Teclado (`ArrowRight`, ` `, `PageDown`, `ArrowLeft`, `PageUp`, `Escape`) controla la presentación y libera el `wakeLock` al salir. |
| 18 | Realizar 10 consultas distintas | El historial conserva solo las 8 más recientes, sin repetidos | ☑ | `saveHistory` deduplica con `filter((x) => x !== label)` y recorta a 8 elementos con `.slice(0, 8)` en `localStorage`. |
| 19 | Cambiar tema del sistema a oscuro | La app cambia a colores oscuros | ☑ | `@media (prefers-color-scheme: dark)` conmuta las variables CSS (`--bg`, `--fg`, `--card`, `--accent`) en tiempo real. |
| 20 | Modo avión tras haber leído Juan 3 | Juan 3 abre sin conexión; un capítulo no visitado muestra el mensaje de sin conexión | ☑ | `sw.js` sirve Juan 3 desde `biblia-api-v1` e informa el estado offline en `#net` y `#msg` para capítulos no cacheados. |

---

## 3. Reflexión Final

El desarrollo de **Biblia RV1960 PWA** demuestra que las decisiones de arquitectura de software no son meros tecnicismos aislados, sino instrumentos de servicio directo a las personas. Como recuerda **2 Timoteo 3:16-17**, toda la Escritura es inspirada por Dios y útil para enseñar, redargüir, corregir e instruir en justicia, a fin de que el creyente esté enteramente preparado para toda buena obra. Sin embargo, para que esa preparación ocurra en comunidades rurales, iglesias locales o regiones con infraestructura de telecomunicaciones precaria, la tecnología debe adaptarse a la realidad del usuario. Implementar un Service Worker con estrategia *cache-first* para el *App Shell* (`biblia-shell-v1`) y *stale-while-revalidate* para la API (`biblia-api-v1`) garantiza que cada capítulo estudiado permanezca disponible sin conexión, permitiendo que la Palabra siga siendo «lámpara a mis pies y lumbrera a mi camino» (**Salmos 119:105**) aun cuando la señal móvil desaparezca.

Asimismo, el rigor cristiano exige integridad ética y legal en el ejercicio profesional de la ingeniería de software (**Isaías 8:20**: *«¡A la ley y al testimonio!»*). Aunque `bolls.life` provee acceso abierto con fines educativos, el texto de la Reina-Valera 1960 cuenta con derechos de autor administrados por las Sociedades Bíblicas Unidas. Un arquitecto de software responsable evita el almacenamiento masivo no autorizado redistribuido con fines comerciales, documenta con transparencia la fuente de los datos, sanitiza las respuestas para proteger al lector de vulnerabilidades XSS y, ante un eventual despliegue público a gran escala, tramita las licencias correspondientes o integra traducciones de dominio público.

Finalmente, siguiendo el ejemplo de los creyentes de Berea en **Hechos 17:11** —quienes escudriñaban cada día las Escrituras para comprobar si las cosas eran así—, la aplicación fue diseñada deliberadamente para cargar siempre el **capítulo completo** en lugar de devolver fragmentos aislados. Al resaltar el versículo buscado (`li.sel`) y centrarlo mediante desplazamiento suave dentro de su capítulo íntegro, además de permitir cruzar fluidamente entre libros vecinos con los botones `◀` y `▶`, la interfaz fomenta una lectura fiel al contexto literario y teológico, evitando la práctica riesgosa de citar textos fuera de su marco original.
