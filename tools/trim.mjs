// node trim-clips.mjs <ffmpeg> <inDir> <outDir> [gap=0.8]
// Splits each clip at silences >= gap, keeps the longest spoken stretch (drops a stray blip before or
// after a long pause), and trims on decoded audio. The mp3 header's duration is an estimate; never used.
import fs from "fs"; import { spawnSync } from "child_process";
const [ff, inDir, outDir, gap = "0.8"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const stats = { n: 0, changed: 0, silent: [] };
for (const f of fs.readdirSync(inDir).filter(f => f.endsWith(".mp3"))) {
  const src = `${inDir}/${f}`;
  const r = spawnSync(ff, ["-i", src, "-af", `silencedetect=n=-55dB:d=${gap}`, "-f", "null", "-"], { encoding: "utf8" });
  const t = [...r.stderr.matchAll(/time=(\d+):(\d+):([\d.]+)/g)].pop(); const total = t ? +t[1] * 3600 + +t[2] * 60 + +t[3] : 0;
  const ev = [...r.stderr.matchAll(/silence_(start|end): ([0-9.]+)/g)].map(m => [m[1], +m[2]]);
  const segs = []; let cur = 0;
  for (const [k, v] of ev) { if (k === "start") { if (v - cur > 0.02) segs.push([cur, v]); } else cur = v; }
  if (!ev.length || ev[ev.length - 1][0] === "end") if (total - cur > 0.02) segs.push([cur, total]);
  if (!segs.length) { stats.silent.push(f); continue; }
  const [a, b] = segs.reduce((x, y) => (y[1] - y[0] > x[1] - x[0] ? y : x));
  if (segs.length > 1 || a > 0.3) stats.changed++;
  const s0 = Math.max(0, a - 0.05), s1 = Math.min(total, b + 0.15);
  spawnSync(ff, ["-v", "error", "-y", "-i", src, "-af",
    `atrim=start=${s0.toFixed(3)}:end=${s1.toFixed(3)},asetpts=PTS-STARTPTS,silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.1,areverse`,
    "-ar", "44100", "-ac", "1", "-b:a", "64k", `${outDir}/${f}`]);
  stats.n++;
}
console.log(inDir, JSON.stringify(stats));
