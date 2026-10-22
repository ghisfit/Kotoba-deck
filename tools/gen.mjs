// node kotoba-gen.mjs <repoDir> <outDir> <a|s> <from> <to> [model]   key: XI_KEY env. Resumable: skips files already in outDir.
import fs from "fs";
const [repo, out, kind, from, to, model = "eleven_flash_v2_5"] = process.argv.slice(2);
const VOICE = "cgSgspJ2msm6clMCkdW9"; // Jessica
const h = fs.readFileSync(repo + "/index.html", "utf8");
const i0 = h.indexOf("const DECK=") + 11; let d = 0, j = i0;
for (; j < h.length; j++) { if (h[j] == "[") d++; else if (h[j] == "]" && !--d) break; }
const DECK = JSON.parse(h.slice(i0, j + 1));
const EX = JSON.parse(fs.readFileSync(repo + "/examples.json", "utf8"));
const kanji = /[\u4e00-\u9fff]/;
export function reading(w) {
  let r = w[1] || w[0];
  if (kanji.test(r) && !kanji.test(w[0])) r = w[0];
  r = r.replace(/\s*\(かん\)/g, "").replace(/[～〜~]/g, "").replace(/[()]/g, "").replace(/\s*[;；]\s*/g, "、").replace(/\s+/g, "");
  return r.replace(/^、|、$/g, "");
}
const text = k => kind === "a" ? reading(DECK[k]) : EX[k][0];
const todo = []; for (let k = +from; k < Math.min(+to, DECK.length); k++) if (!fs.existsSync(`${out}/${k}.mp3`)) todo.push(k);
let chars = 0, fail = 0;
async function one(k) {
  const t = text(k); if (!t) return;
  for (let a = 0; a < 6; a++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`, {
      method: "POST", headers: { "xi-api-key": process.env.XI_KEY, "content-type": "application/json" },
      body: JSON.stringify({ text: t, model_id: model, language_code: "ja" }) }).catch(e => ({ ok: false, status: 0, text: async () => String(e) }));
    if (r.ok) { fs.writeFileSync(`${out}/${k}.mp3`, Buffer.from(await r.arrayBuffer())); chars += t.length; return; }
    const body = (await r.text()).slice(0, 200);
    if (r.status === 401 || r.status === 402 || /quota/.test(body)) { console.error("STOP", k, r.status, body); process.exit(2); }
    await new Promise(z => setTimeout(z, 1500 * (a + 1)));
    if (a === 5) { fail++; console.error("fail", k, r.status, body); }
  }
}
let next = 0;
await Promise.all([0, 1, 2].map(async () => { while (next < todo.length) { await one(todo[next++]); if (next % 250 === 0) console.log(next, "/", todo.length); } }));
console.log(`done ${kind} ${from}-${to}: ${todo.length - fail} written, ${fail} failed, ${chars} chars`);
