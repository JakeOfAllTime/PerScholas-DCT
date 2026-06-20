# Data Center Flight Deck

A local-first web app for Per Scholas Data Center Technician study. It turns messy class notes into structured review material, weak-spot tracking, flash drills, and realistic troubleshooting tickets.

This is an independent student learning tool and is not official Per Scholas course material.

Live app: [https://perscholas-dct.vercel.app](https://perscholas-dct.vercel.app)

## What it does

- Captures messy class or lab notes by typing or browser voice input.
- Distills notes into domains: Networking, Power, Cooling, Server Hardware, and Safety + Tools.
- Tracks confidence by domain and highlights weak spots.
- Groups captures by day in a weekly calendar for review.
- Generates flash drills from captured terms and open questions.
- Creates realistic incident tickets and grades troubleshooting responses.
- Exports the full local vault as JSON and Markdown.
- Exports individual weeks as Markdown study reviews.
- Runs as a dependency-free static web app.

## Run locally

```sh
python3 -m http.server 5174
```

Then open:

```text
http://localhost:5174
```

## Phone use

When your Mac and phone are on the same Wi-Fi network, run the server with:

```sh
python3 -m http.server 5174 --bind 0.0.0.0
```

Then open `http://YOUR_MAC_IP:5174` on your phone. Voice capture depends on browser support and microphone permissions.

## Notes

The current prototype stores everything in your browser with `localStorage`, including notes, confidence ratings, and the calendar history. That makes the app simple and private, but the data is tied to the browser/device.

Use **Vault > Export Data** to download a full JSON backup. That file can be imported later with **Vault > Import Data**. Use **Export Markdown** or **Export Week** when you want a readable study review.

The Vercel deployment makes the app easy to open from any device, but it does not provide shared cloud storage by itself. Longer term, the best upgrade is optional sync so Mac and phone can share the same study history automatically.

## Roadmap

- Custom study tracks for Data Center Technician, Google IT Support, CompTIA A+, and interview/professionalism training.
- User-editable domains, tags, and ticket templates.
- Optional AI provider integration for deeper note distillation and coaching.
- Import/export packs so classmates can share drills without sharing private notes.
- A portfolio mode for turning labs into polished employer-facing writeups.

## License

MIT
