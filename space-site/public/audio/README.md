# Real space recordings (drop-in)

The site plays a **real recording** for an object when you fly past it. If a file is missing, the built-in synthesised
sound plays instead, so nothing is ever silent. Put your files in this folder and make sure the name matches
`manifest.json` (or edit the manifest).

> **Honest note:** space is (almost) a vacuum, so "sounds of the planets" are *radio waves, plasma waves and telescope
> data converted to audio* (audification / sonification) — Perseverance's Mars microphone is the one true direct recording.
> Say so in your credits (the footer line is filled in automatically from `credit` in the manifest).

## Where to get free, usable files
| Source | What's there | Licence |
|---|---|---|
| **NASA on SoundCloud** — soundcloud.com/nasa | "Sun Sonification", "Sounds of Saturn: Radio Emissions of the Planet and Its Moon Enceladus", "Voyager Plasma Sounds", Cassini Saturn radio emissions, Juno Jupiter bow-shock, Earth "Plasmaspheric Hiss" (Polar), Stardust dust hits… | NASA audio is generally not copyrighted — credit **NASA** as the source, don't use the NASA logo or imply endorsement ([media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)) |
| **NASA Audio Collection** — archive.org/details/nasaaudiocollection | 200+ files, 24-bit/48 kHz WAV (mission audio, Apollo, etc.) | as above |
| **Chandra "A Universe of Sound"** — chandra.si.edu/sound | Perseus-cluster black hole (`/sound/perseus.html`), Galactic Center and other nebula / galaxy sonifications, each page has file downloads | NASA / Chandra X-ray Center — credit them |
| **University of Iowa Space Audio** (Plasma Wave group) | Voyager / Cassini / Juno plasma-wave recordings (Jupiter, Saturn, Uranus, Neptune) | check the page's terms; credit "NASA / University of Iowa" |
| **NASA/JPL Perseverance** (Mars) | Microphone recordings: wind, dust devil, rover sounds, Ingenuity | NASA — credit it |
| **ESA on SoundCloud** — soundcloud.com/esa | ESA space sounds | many are CC BY-SA — read each track |

## Suggested mapping (save as → what to look for)
| Object | Save as | Real recording to look for |
|---|---|---|
| Sun | `sun.mp3` | NASA "Sun Sonification" |
| Earth | `earth.mp3` | NASA/Polar "Plasmaspheric Hiss", Earth chorus / whistlers |
| Mars | `mars.mp3` | Perseverance microphone — wind / dust devil |
| Jupiter | `jupiter.mp3` | Juno Waves bow-shock recording, or Cassini/Voyager Jupiter plasma waves |
| Saturn | `saturn.mp3` | "Sounds of Saturn…" / Cassini Saturn radio emissions |
| Uranus, Neptune | `uranus.mp3`, `neptune.mp3` | Voyager 2 plasma-wave recordings (NASA "Voyager Plasma Sounds", U. Iowa) |
| Supermassive Black Hole | `black-hole.mp3` | Chandra Perseus-cluster black-hole sonification |
| Galactic Center, Crab Nebula, Eagle Nebula … | `galactic-center.mp3`, `crab-nebula.mp3`, `eagle-nebula.mp3` | matching pages in Chandra's "A Universe of Sound" (if one exists) |
| Moon | `moon.mp3` | Apollo-era audio in the NASA Audio Collection |
| Mercury, Venus, pulsars, clusters, galaxies, Big Bang … | — | I could not confirm a ready-made recording; leave them out and the synthesised sound plays (or add your own, e.g. LIGO's gravitational-wave chirp — check its licence) |

Avoid commercial CDs that *sell* "planet sounds" (e.g. "Symphonies of the Planets") — they are heavily processed and copyrighted.

## Prepare files (small + loop-friendly)
Keep each file short (30–90 s) and ~1 MB so the page stays fast:
```bash
ffmpeg -i input.wav -t 60 -ac 1 -b:a 96k jupiter.mp3
```
If a recording has a loud start or gaps, set `start` / `end` (seconds) for that entry in `manifest.json` to loop a clean section.
