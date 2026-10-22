# Recording more audio

Words (`a/`) are all recorded. Example sentences (`s/`) are recorded from 0 up to `SENT_REC` in `index.html`; the rest play with the phone voice.

To record the next batch (ElevenLabs free plan = 10,000 credits a month; Flash costs half a credit per character, about 1,000 sentences):

```sh
export XI_KEY=...            # never commit it
node tools/gen.mjs . out/s s 771 1800          # resumable; stops on quota
node tools/check.mjs <ffmpeg> out/s 1.0 $(ls out/s)   # lists broken clips
#   re-record those with: rm them, then the same gen command + eleven_multilingual_v2 as 6th arg
node tools/trim.mjs <ffmpeg> out/s out/s-trim 1.0      # keep the spoken part
cp out/s-trim/*.mp3 s/      # then set SENT_REC to the first sentence NOT recorded, bump sw.js
```

`<ffmpeg>`: e.g. `npm i ffmpeg-static` somewhere outside the repo. Voice is Jessica (`cgSgspJ2msm6clMCkdW9`).
Check the account first: `curl -H "xi-api-key: $XI_KEY" https://api.elevenlabs.io/v1/user/subscription`.
About 1 clip in 100 comes back broken on Flash (late start, extra words, cut off); it repeats on the same text, so re-record those with multilingual v2.
