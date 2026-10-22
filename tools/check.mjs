import {spawnSync} from "child_process"; import fs from "fs";
const [ff, dir, gap, ...files] = process.argv.slice(2); const bad = [];
for (const f of files) {
  const r = spawnSync(ff, ["-i", `${dir}/${f}`, "-af", `silencedetect=n=-55dB:d=${gap}`, "-f", "null", "-"], { encoding: "utf8" });
  const t = [...r.stderr.matchAll(/time=(\d+):(\d+):([\d.]+)/g)].pop(); const total = t ? +t[2] * 60 + +t[3] : 0;
  const ev = [...r.stderr.matchAll(/silence_(start|end): ([0-9.]+)/g)].map(m => [m[1], +m[2]]);
  const lead = ev[0] && ev[0][0] == "start" && ev[0][1] < 0.05 ? (ev[1] ? ev[1][1] : total) : 0;
  const inner = ev.filter(e => e[0] == "start" && e[1] >= 0.05).some(e => e[1] < total - 0.1 - +gap);
  if (lead > 0.3 || inner || lead >= total - 0.05) bad.push(f);
}
console.log(bad.join(" "));
