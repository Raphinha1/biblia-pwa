// Lógica pura (sin DOM): normalización, parser de referencias y limpieza de texto.
import { BOOKS } from "./books.js";

/** Minúsculas, sin acentos, sin puntos ni espacios sobrantes. */
export function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Índice de búsqueda: nombre completo, nombre sin espacios y alias -> libro.
const INDEX = new Map();
for (const b of BOOKS) {
  const full = normalize(b.name);
  INDEX.set(full, b);
  INDEX.set(full.replace(/ /g, ""), b);
  for (const a of b.alias) INDEX.set(a, b);
}

/** Busca un libro por nombre exacto, alias o prefijo único ("apoc", "1 cor"). */
export function findBook(text) {
  const key = normalize(text);
  if (INDEX.has(key)) return INDEX.get(key);
  if (INDEX.has(key.replace(/ /g, ""))) return INDEX.get(key.replace(/ /g, ""));
  // Prefijo: aceptamos solo si hay un único candidato (por nombre completo).
  const compact = key.replace(/ /g, "");
  if (compact.length < 3) return null;
  const hits = BOOKS.filter((b) => normalize(b.name).replace(/ /g, "").startsWith(compact));
  return hits.length === 1 ? hits[0] : null;
}

/**
 * Convierte "Juan 3:16", "jn 3", "1 Corintios 13:4-7" en un objeto:
 * { book, chapter, verseStart, verseEnd }  (verseStart/End = null si es capítulo completo)
 * Devuelve { error } si no se puede interpretar o está fuera de rango.
 */
export function parseReference(input) {
  const m = input.trim().match(/^(.+?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  if (!m) return { error: "Escribe algo como «Juan 3:16», «Salmos 23» o «1 Corintios 13:4-7»." };
  const book = findBook(m[1]);
  if (!book) return { error: `No reconozco el libro «${m[1].trim()}».` };
  const chapter = Number(m[2]);
  if (chapter < 1 || chapter > book.chapters)
    return { error: `${book.name} tiene ${book.chapters} capítulos.` };
  const verseStart = m[3] ? Number(m[3]) : null;
  let verseEnd = m[4] ? Number(m[4]) : verseStart;
  if (verseStart !== null && verseEnd < verseStart) verseEnd = verseStart;
  return { book, chapter, verseStart, verseEnd };
}

/**
 * bolls.life devuelve texto en HTML (<br>, <i>, y a veces marcas <S>1234</S> de Strong).
 * Quitamos las marcas de Strong con su contenido y el resto de etiquetas.
 */
export function cleanText(html) {
  return String(html ?? "")
    .replace(/<S>.*?<\/S>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Texto de referencia legible: "Juan 3:16-18" o "Salmos 23". */
export function formatRef(book, chapter, vs = null, ve = null) {
  if (vs === null) return `${book.name} ${chapter}`;
  return ve && ve !== vs ? `${book.name} ${chapter}:${vs}-${ve}` : `${book.name} ${chapter}:${vs}`;
}
