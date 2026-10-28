# Reglas de Arquitectura y Gobernanza (`AGENTS.md`)

Este documento define las directrices técnicas, restricciones de seguridad y estándares de calidad obligatorios para cualquier contribución (humana o asistida por IA) dentro del repositorio **`biblia-pwa`**.

---

## 1. Principios de Arquitectura

| Principio | Regla Obligatoria | Justificación Técnica |
|-----------|-------------------|-----------------------|
| **Vanilla JS (ES Modules)** | Uso exclusivo de JavaScript estándar (`type="module"`, `import`/`export`). | Evita complejidad accidental, pasos de compilación (*bundlers*) y permite probar la lógica pura directamente en Node.js. |
| **Cero Frameworks / Dependencias** | Prohibido añadir librerías de terceros en `package.json` (`dependencies` o `devDependencies`). | Garantiza un peso mínimo del *App Shell*, carga instantánea y mantenimiento a largo plazo sin deuda de dependencias. |
| **Separación de Responsabilidades** | `books.js` (datos), `lib.js` (lógica pura), `api.js` (red), `app.js` (DOM/UI), `sw.js` (caché offline). | Desacopla el núcleo algorítmico de la interfaz gráfica para facilitar pruebas unitarias deterministas en `tests/lib.test.mjs`. |

---

## 2. Seguridad y Manejo del DOM

1. **Prohibición de `innerHTML` sin sanitización previa:**
   - Todo contenido proveniente de la API externa (`https://bolls.life`) se considera **no confiable**.
   - Antes de procesar cualquier versículo, debe limpiarse mediante `cleanText(html)` en `js/lib.js` para remover etiquetas `<br>`, `<i>` y concordancias Strong `<S>...</S>`.
   - Al inyectar contenido dinámico en el DOM (`js/app.js`), es **obligatorio** aplicar `escapeHTML(s)` (defensa en profundidad contra ataques Cross-Site Scripting - XSS) o utilizar `textContent`.
2. **Orígenes Seguros:**
   - El Service Worker (`sw.js`), la Clipboard API (`navigator.clipboard`) y Web Share API (`navigator.share`) requieren ejecución sobre `http://localhost`, `http://127.0.0.1` o `HTTPS`.

---

## 3. Estándares de Calidad y Pruebas

- **Integridad Canónica:** `js/books.js` debe contener exactamente los 66 libros canónicos protestantes (`id` consecutivos del `1` al `66`), sin alias duplicados ni colisiones entre libros, sumando exactamente **1,189 capítulos**.
- **Verificación Automatizada:** Cualquier cambio en `js/books.js` o `js/lib.js` debe pasar el conjunto de 25 pruebas unitarias ejecutando:
  ```bash
  node tests/lib.test.mjs
  ```
  El proceso debe finalizar con código de salida `0`.
- **Versionado de Caché:** Toda modificación en archivos del *App Shell* requiere incrementar la constante `VERSION` en `sw.js` para invalidar el caché obsoleto en los clientes instalados.

---

## 4. Estándar de Documentación

- **`README.md`:** Documentación técnica principal redactada estrictamente en **inglés**, con diseño visual moderno y tablas de referencia rápida.
- **`MEMORY.md`:** Bitácora viva del estado del proyecto, decisiones de arquitectura e iteraciones completadas.
- **`docs/`:** Directorio reservado para reportes académicos, evidencias de exploración de API, matrices de pruebas funcionales y reflexiones del laboratorio.
- **Idioma del Código e Interfaz:** Comentarios de dominio, interfaz de usuario (`index.html`, mensajes de `lib.js` y `app.js`) en **español** neutro y claro conforme a la especificación académica.
