import { parseReference, cleanText, formatRef, findBook } from "../js/lib.js";
import { BOOKS } from "../js/books.js";
let fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(ok ? "PASS" : "FAIL", name, ok ? "" : `got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); };
const p = (s) => { const r = parseReference(s); return r.error ? { error: r.error } : { b: r.book.id, c: r.chapter, vs: r.verseStart, ve: r.verseEnd }; };
eq("Juan 3:16", p("Juan 3:16"), { b: 43, c: 3, vs: 16, ve: 16 });
eq("jn 3", p("jn 3"), { b: 43, c: 3, vs: null, ve: null });
eq("1 Corintios 13:4-7", p("1 Corintios 13:4-7"), { b: 46, c: 13, vs: 4, ve: 7 });
eq("1corintios 13", p("1corintios 13"), { b: 46, c: 13, vs: null, ve: null });
eq("1 jn 4:8", p("1 jn 4:8"), { b: 62, c: 4, vs: 8, ve: 8 });
eq("Génesis 1:1", p("Génesis 1:1"), { b: 1, c: 1, vs: 1, ve: 1 });
eq("genesis sin acento", p("genesis 1:1"), { b: 1, c: 1, vs: 1, ve: 1 });
eq("Sal 23", p("Sal 23"), { b: 19, c: 23, vs: null, ve: null });
eq("Apoc 22:21 (prefijo)", p("Apoc 22:21"), { b: 66, c: 22, vs: 21, ve: 21 });
eq("Hch 2:38", p("Hch 2:38"), { b: 44, c: 2, vs: 38, ve: 38 });
eq("rango invertido 7-4", p("Juan 3:7-4"), { b: 43, c: 3, vs: 7, ve: 7 });
eq("capítulo fuera de rango", p("Juan 22").error, "Juan tiene 21 capítulos.");
eq("libro inexistente", p("Foo 3").error, "No reconozco el libro «Foo».");
eq("sin número", !!p("Juan").error, true);
eq("cleanText <br> e <i>", cleanText("En el principio<br/> creó <i>Dios</i>"), "En el principio creó Dios");
eq("cleanText Strong", cleanText("Dios<S>H430</S> creó"), "Dios creó");
eq("cleanText nbsp/amp", cleanText("a&nbsp;b &amp; c"), "a b & c");
eq("formatRef rango", formatRef(BOOKS[42], 3, 16, 18), "Juan 3:16-18");
eq("formatRef cap", formatRef(BOOKS[18], 23), "Salmos 23");
eq("66 libros", BOOKS.length, 66);
eq("ids consecutivos", BOOKS.every((b, i) => b.id === i + 1), true);
eq("total capítulos = 1189", BOOKS.reduce((s, b) => s + b.chapters, 0), 1189);
// alias duplicados que apuntan a libros distintos
const seen = new Map(); let dup = [];
for (const b of BOOKS) for (const a of b.alias) { if (seen.has(a) && seen.get(a) !== b.id) dup.push(a); seen.set(a, b.id); }
eq("alias sin colisiones", dup, []);
// 2 pruebas adicionales requeridas por la rúbrica
eq("2 Pedro 1:3", p("2 Pedro 1:3"), { b: 61, c: 1, vs: 3, ve: 3 });
eq("espacios extra Rom 8:28", p("   Rom   8:28 "), { b: 45, c: 8, vs: 28, ve: 28 });
console.log(fail ? `\n${fail} FALLARON` : "\nTodas pasaron");
process.exit(fail ? 1 : 0);
