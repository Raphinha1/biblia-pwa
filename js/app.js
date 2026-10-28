import { BOOKS } from "./books.js";
import { parseReference, cleanText, formatRef } from "./lib.js";
import { getChapter, getRandomVerse } from "./api.js";

const $ = (id) => document.getElementById(id);
const state = { book: null, chapter: null, verses: [], selStart: null, selEnd: null, fs: 1.1, pIndex: 0, pList: [] };

/* ---------- Inicialización de controles ---------- */
function fillSelectors() {
  $("selLibro").innerHTML = BOOKS.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");
  $("libros").innerHTML = BOOKS.map((b) => `<option value="${b.name}">`).join("");
  fillChapters(BOOKS[0]);
}
function fillChapters(book) {
  $("selCap").innerHTML = Array.from({ length: book.chapters }, (_, i) =>
    `<option value="${i + 1}">Capítulo ${i + 1}</option>`).join("");
}

/* ---------- Mensajes ---------- */
function showMsg(text) { $("msg").textContent = text; $("msg").hidden = !text; }

/* ---------- Carga y render ---------- */
async function loadReference(book, chapter, vs = null, ve = null) {
  showMsg("");
  $("result").hidden = false;
  $("refTitle").textContent = "Cargando…";
  $("verses").innerHTML = "";
  try {
    const raw = await getChapter(book.id, chapter);
    state.book = book; state.chapter = chapter;
    state.verses = raw.map((v) => ({ n: v.verse, text: cleanText(v.text) }));
    state.selStart = vs; state.selEnd = ve;
    render();
    saveHistory(formatRef(book, chapter, vs, ve));
    $("selLibro").value = book.id; fillChapters(book); $("selCap").value = chapter;
    if (vs !== null) {
      const first = $("verses").querySelector("li.sel");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } catch (err) {
    $("result").hidden = true;
    showMsg(navigator.onLine
      ? `No se pudo cargar: ${err.message}`
      : "Sin conexión y este capítulo aún no está guardado en el dispositivo.");
  }
}

function render() {
  const { book, chapter, verses, selStart, selEnd } = state;
  $("refTitle").textContent = formatRef(book, chapter, selStart, selEnd);
  $("verses").innerHTML = verses.map((v) => {
    const sel = selStart !== null && v.n >= selStart && v.n <= selEnd ? " sel" : "";
    return `<li class="${sel.trim()}" data-n="${v.n}"><sup>${v.n}</sup>${escapeHTML(v.text)}</li>`;
  }).join("");
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Eventos de búsqueda ---------- */
$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const r = parseReference($("q").value);
  if (r.error) { showMsg(r.error); return; }
  loadReference(r.book, r.chapter, r.verseStart, r.verseEnd);
});
$("selLibro").addEventListener("change", () => fillChapters(BOOKS.find((b) => b.id === Number($("selLibro").value))));
$("btnCap").addEventListener("click", () =>
  loadReference(BOOKS.find((b) => b.id === Number($("selLibro").value)), Number($("selCap").value)));

/* ---------- Reto ★★: Versículo al azar ---------- */
$("btnRandom").addEventListener("click", async () => {
  showMsg("");
  try {
    const v = await getRandomVerse();
    const book = BOOKS.find((b) => b.id === Number(v.book));
    if (!book) throw new Error("Libro no reconocido en el canon.");
    const chapter = Number(v.chapter);
    const verse = Number(v.verse);
    $("q").value = formatRef(book, chapter, verse, verse);
    await loadReference(book, chapter, verse, verse);
  } catch (err) {
    showMsg(navigator.onLine
      ? `No se pudo obtener un versículo al azar: ${err.message}`
      : "Se requiere conexión a internet para obtener un versículo al azar.");
  }
});

/* ---------- Reto ★: Copiar y Compartir ---------- */
function getActivePassage() {
  const { book, chapter, verses, selStart, selEnd } = state;
  if (!book || !verses.length) return null;
  const list = selStart !== null
    ? verses.filter((v) => v.n >= selStart && v.n <= selEnd)
    : verses;
  const ref = formatRef(book, chapter, selStart, selEnd);
  const body = list.map((v) => `${v.n}. ${v.text}`).join(" ");
  return { ref, text: `${ref} (RV1960)\n${body}` };
}

$("btnCopy").addEventListener("click", async () => {
  const passage = getActivePassage();
  if (!passage) return;
  try {
    await navigator.clipboard.writeText(passage.text);
    const prev = $("btnCopy").textContent;
    $("btnCopy").textContent = "✓ Copiado";
    setTimeout(() => { $("btnCopy").textContent = prev; }, 1600);
  } catch {
    showMsg("No se pudo copiar al portapapeles.");
  }
});

if (navigator.share) {
  $("btnShare").hidden = false;
  $("btnShare").addEventListener("click", async () => {
    const passage = getActivePassage();
    if (!passage) return;
    try {
      await navigator.share({ title: passage.ref, text: passage.text });
    } catch (err) {
      if (err?.name !== "AbortError") showMsg("No se pudo compartir el pasaje.");
    }
  });
}

/* Clic en versículo: lo selecciona; clic de nuevo lo quita */
$("verses").addEventListener("click", (e) => {
  const li = e.target.closest("li"); if (!li) return;
  const n = Number(li.dataset.n);
  if (state.selStart === n && state.selEnd === n) state.selStart = state.selEnd = null;
  else state.selStart = state.selEnd = n;
  render();
});

/* Capítulo anterior / siguiente (cruza de libro si hace falta) */
function step(delta) {
  let { book, chapter } = state;
  chapter += delta;
  if (chapter < 1) { book = BOOKS[Math.max(0, BOOKS.indexOf(book) - 1)]; chapter = book.chapters; }
  else if (chapter > book.chapters) { book = BOOKS[Math.min(BOOKS.length - 1, BOOKS.indexOf(book) + 1)]; chapter = 1; }
  loadReference(book, chapter);
}
$("btnPrev").addEventListener("click", () => step(-1));
$("btnNext").addEventListener("click", () => step(1));

/* Tamaño de letra */
function setFs(v) { state.fs = Math.min(2.2, Math.max(0.8, v)); document.documentElement.style.setProperty("--fs", state.fs + "rem"); }
$("btnBigger").addEventListener("click", () => setFs(state.fs + 0.1));
$("btnSmaller").addEventListener("click", () => setFs(state.fs - 0.1));

/* ---------- Modo presentación ---------- */
let wakeLock = null;
async function openPresenter() {
  const { verses, selStart, selEnd } = state;
  state.pList = selStart !== null ? verses.filter((v) => v.n >= selStart && v.n <= selEnd) : verses;
  if (!state.pList.length) return;
  state.pIndex = 0;
  $("presenter").hidden = false;
  paintPresenter();
  try { await document.documentElement.requestFullscreen?.(); } catch {}
  try { wakeLock = await navigator.wakeLock?.request("screen"); } catch {}
}
function closePresenter() {
  $("presenter").hidden = true;
  if (document.fullscreenElement) document.exitFullscreen();
  wakeLock?.release?.(); wakeLock = null;
}
function paintPresenter() {
  const v = state.pList[state.pIndex];
  $("pText").textContent = v.text;
  $("pRef").textContent = formatRef(state.book, state.chapter, v.n);
  $("pCount").textContent = `${state.pIndex + 1} / ${state.pList.length}`;
}
function pStep(d) {
  state.pIndex = Math.min(state.pList.length - 1, Math.max(0, state.pIndex + d));
  paintPresenter();
}
$("btnPresent").addEventListener("click", openPresenter);
$("pClose").addEventListener("click", closePresenter);
$("pPrev").addEventListener("click", () => pStep(-1));
$("pNext").addEventListener("click", () => pStep(1));
document.addEventListener("keydown", (e) => {
  if ($("presenter").hidden) return;
  if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); pStep(1); }
  else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); pStep(-1); }
  else if (e.key === "Escape") closePresenter();
});
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && !$("presenter").hidden) closePresenter(); });

/* ---------- Historial (localStorage) ---------- */
const HKEY = "biblia-historial";
function saveHistory(label) {
  let h = JSON.parse(localStorage.getItem(HKEY) || "[]");
  h = [label, ...h.filter((x) => x !== label)].slice(0, 8);
  localStorage.setItem(HKEY, JSON.stringify(h));
  renderHistory();
}
function renderHistory() {
  const h = JSON.parse(localStorage.getItem(HKEY) || "[]");
  $("history").hidden = h.length === 0;
  $("histList").innerHTML = h.map((x) => `<li><button type="button" data-ref="${escapeHTML(x)}">${escapeHTML(x)}</button></li>`).join("");
}
$("histList").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  $("q").value = b.dataset.ref; $("form").requestSubmit();
});

/* ---------- Estado de red y Service Worker ---------- */
function paintNet() { $("net").textContent = navigator.onLine ? "en línea" : "sin conexión"; $("net").classList.toggle("off", !navigator.onLine); }
addEventListener("online", paintNet); addEventListener("offline", paintNet);

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW:", e)));
}

fillSelectors(); renderHistory(); paintNet();
