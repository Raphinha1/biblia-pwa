# Registro de Estado y Memoria del Proyecto (`MEMORY.md`)

**Proyecto:** `biblia-pwa` (Buscador de la Biblia Reina-Valera 1960 — Progressive Web App)  
**Estado Actual:** ✅ **COMPLETADO Y VERIFICADO (v1.0.0)**  
**Última Actualización:** 2026-10-28

---

## 1. Resumen de Arquitectura Implementada

Se diseñó y construyó una arquitectura modular desacoplada basada al 100 % en estándares nativos de la plataforma web (**Vanilla JavaScript con ES Modules**, sin frameworks ni dependencias externas):

| Componente | Ruta | Estado | Descripción Técnica |
|------------|------|:------:|---------------------|
| **Configuración Node** | `package.json` | ✅ | Declara `"type": "module"` y `"private": true` para ejecución nativa de pruebas en Node.js. |
| **Gobernanza** | `AGENTS.md` | ✅ | Reglas de arquitectura limpia, prohibición de `innerHTML` sin sanitización previa y estándares del repositorio. |
| **Documentación Técnica** | `README.md` | ✅ | Documentación en inglés con estética *dark futuristic*, diagrama de arquitectura, estrategia de caché y guía de despliegue HTTPS. |
| **Datos Canónicos** | `js/books.js` | ✅ | Exporta `BOOKS` con los 66 libros canónicos protestantes (`id` 1 a 66), **1,189 capítulos** exactos y corrección de alias sin duplicados en Jonás (`id: 32`, `alias: ["jon"]`). |
| **Lógica Pura** | `js/lib.js` | ✅ | Exporta `normalize`, `findBook`, `parseReference`, `cleanText` y `formatRef` sin dependencias del DOM. |
| **Cliente REST API** | `js/api.js` | ✅ | Cliente asíncrono para `https://bolls.life` (`RV1960`) con `getChapter`, `getVerse` y `getRandomVerse`. |
| **Interfaz Semántica** | `index.html` | ✅ | HTML5 semántico (`lang="es"`), `viewport-fit=cover`, `theme-color` `#1f3a5f`, atributos ARIA (`role="status"`, `role="alert"`), `<datalist id="libros">` y controles de retos integrados. |
| ** Sistema de Diseño** | `styles.css` | ✅ | Variables CSS reactivas a `@media (prefers-color-scheme: dark)`, tipografía fluida con `clamp()` para el modo presentación y `:focus-visible` accesible. |
| **Controlador UI** | `js/app.js` | ✅ | Renderizado seguro con `escapeHTML`, navegación entre capítulos cruzando libros, modo presentación con Fullscreen API + Wake Lock API, historial en `localStorage` (máx. 8 únicos) y conexión con Service Worker. |
| **Manifiesto Web** | `manifest.webmanifest` | ✅ | Configuración `display: "standalone"`, rutas relativas (`start_url: "./index.html"`, `scope: "./"`) y 3 íconos PNG (`192x192`, `512x512`, `maskable 512x512`). |
| **Service Worker** | `sw.js` | ✅ | Estrategia *cache-first* para el App Shell (`biblia-shell-v1`) y *stale-while-revalidate* para la API (`biblia-api-v1`). |
| **Íconos PWA** | `icons/*.png` | ✅ | Generados programáticamente con `Pillow` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) con diseño de libro abierto y cruz dorada sobre fondo `#1f3a5f`. Script temporal `crear_iconos.py` eliminado tras verificación. |
| **Entregables** | `docs/ENTREGABLES_REPORTE.md` | ✅ | Incluye la Actividad de Exploración de la API, la Tabla de 20 Pruebas Funcionales (`☑`) y la Reflexión Final integrando principios de ingeniería de software y pasajes bíblicos. |

---

## 2. Retos Adicionales Integrados (★ y ★★)

1. **Reto ★★ — Versículo al azar (`#btnRandom` / `getRandomVerse()`):**
   - Implementado en `js/api.js` consumiendo `https://bolls.life/get-random-verse/RV1960/`.
   - Conectado en `js/app.js` al botón `🎲 Al azar`: localiza el libro en `BOOKS`, actualiza el buscador, carga el capítulo completo para preservar el contexto de lectura y resalta/centra el versículo aleatorio obtenido.
2. **Reto ★ — Copiar al portapapeles (`#btnCopy`):**
   - Implementado en `js/app.js` usando `navigator.clipboard.writeText()`. Copia el versículo o rango seleccionado (o el capítulo completo si no hay selección) precedido por su referencia formateada con `formatRef` y muestra confirmación visual (`✓ Copiado`).
3. **Reto ★ — Compartir nativo (`#btnShare`):**
   - Detecta soporte de `navigator.share` al iniciar; si el navegador lo soporta, descubre el botón `🔗 Compartir` e invoca la hoja de compartir del sistema operativo con el título y texto del pasaje activo.

---

## 3. Registro de Pruebas Ejecutadas

- **Suite Unitaria (`tests/lib.test.mjs`):**
  - Comando ejecutado: `node tests/lib.test.mjs`
  - **23 aserciones base del laboratorio:** `PASS` (normalización, alias, prefijos, rangos invertidos, validación de capítulos, `cleanText` para `<br>`, `<i>`, `<S>`, entidades HTML, `formatRef`, 66 libros, IDs consecutivos, suma de 1,189 capítulos y cero colisiones de alias).
  - **2 aserciones adicionales de rúbrica:**
    1. `"2 Pedro 1:3"` $\rightarrow$ `{ b: 61, c: 1, vs: 3, ve: 3 }` (`PASS`)
    2. `"   Rom   8:28 "` $\rightarrow$ `{ b: 45, c: 8, vs: 28, ve: 28 }` (`PASS`)
  - **Resultado Final:** **25 / 25 pruebas aprobadas (`Todas pasaron`, código de salida `0`).**

---

## 4. Historial de Iteraciones

- **Iteración 1 (Gobernanza y Documentación):** Creación de `AGENTS.md`, `README.md` (tema oscuro futurista en inglés) y estructura `docs/`.
- **Iteración 2 (Núcleo de Dominio y Red):** Implementación de `package.json`, `js/books.js` (sin duplicados en Jonás), `js/lib.js` y `js/api.js` (con `getRandomVerse`).
- **Iteración 3 (Interfaz, PWA y Retos):** Creación de `index.html`, `styles.css`, `js/app.js`, `manifest.webmanifest`, `sw.js` y generación automatizada de íconos PNG en `icons/`.
- **Iteración 4 (Calidad y Entregables Académicos):** Ejecución exitosa de las 25 pruebas unitarias en `tests/lib.test.mjs` y redacción de `docs/ENTREGABLES_REPORTE.md` y `MEMORY.md`.
