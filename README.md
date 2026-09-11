# Petlab · vet-web-5.0

The marketing site for **Petlab by Mobilab** — the veterinary line from Mobilab
(Primary Healthtech Pvt. Ltd.). Petlab brings a point-of-care blood diagnostics
kit to the clinic, the field and the home: a portable analyser, a companion app,
and a dashboard that turns a sample into a vet-readable report in minutes.

This repository is the public-facing website for that product. Two pages, hand
written, no framework and no build step.

## The two pages

**`index.html` — the product story.** Read top to bottom it argues a case: what
the kit is, who has validated it, how AI reporting works, why a lab that travels
changes veterinary practice, what is in the box, the test menu, and how to ask
for a demo.

    hero → validated by → AI reporting → comes to you → the shift → why →
    the kit → demo film → test menu → gallery → about Mobilab → FAQ →
    trust figures → contact

**`duo.html` — the device page.** A closer look at the Mobilab Duo itself: what
sits inside the analyser, how a single test actually runs end to end, the app and
dashboard that read it, and the wider ecosystem it plugs into.

    hero → inside the Duo → how a test runs → test menu → the app + dashboard →
    ecosystem → trust → contact

Both pages share one stylesheet and one script, so the nav, the demo form, the
chat widget and every scroll animation behave identically across them.

## Layout

    index.html        product story page
    duo.html          device page
    styles.css        the entire design system — tokens, type scale, every component
    app.js            nav, scroll reveals, parallax tilt, gallery, film player,
                      chat widget, and the demo form's WhatsApp hand-off
    assets/           every static file, one folder per kind. Nothing lives loose
                      at the top level except CREDITS.md:
      brand/          Petlab lockup and mark, favicons, the social share card
      partners/       institution logos for the trust row (AIIMS, Army, IITG …)
      device/         the physical kit — hero photograph, Duo, kit with analyser
      software/       Mobilab Connect app and the analytics dashboard
      photos/         pet and field photography
      video/          the demo films and their poster frames
      CREDITS.md      where every one of them came from, and its licence
    robots.txt        crawl rules
    sitemap.xml       both pages, for Search Console
    DEPLOY.md         deployment runbook

Roughly 3,000 lines across the four source files. No `node_modules`, no bundler,
no environment variables — open `index.html` in a browser and it works.

## Design

Editorial-minimal, in the manner of a fragrance or fashion house rather than a
medical-device vendor: the claim is that this is a product you would want on the
counter, not just equipment you tolerate.

| | |
|---|---|
| **Ground** | Warm lavender cream `#F5F1FC`, deepening to `#EAE1F9` |
| **Ink** | Near-black purple `#1D1530`, softening through two greys |
| **Brand** | Petlab purple `#3C1D73` and violet `#5B34A0`, with lilac for air |
| **Accent** | A single burnt orange `#C2510E`, carried over from the product deck |
| **Display** | Fraunces — a variable serif, italic for emphasis in headlines |
| **Text** | Inter at weight 300, wide leading |
| **Scale** | Every size is a `clamp()`, so the layout is fluid rather than stepped |

Full-bleed pet photography, generous vertical rhythm (`--sec` runs 90–180px), and
motion that stays subtle — intersection-observer reveals, a light parallax tilt on
the product stages, and a demo film that holds on its final frame instead of
looping. All of it is driven by custom properties at the top of `styles.css`;
change a token there and the whole site follows.

The one film that does loop is the Product section on both pages
(`figure.prod--film`). It starts muted when it scrolls into view, pauses when it
leaves, and stays silent until someone presses **Unmute** — so it never plays
audio at a reader who did not ask for it, and never spends bandwidth on a section
nobody reached. `prefers-reduced-motion: reduce` holds it on the poster frame
until it is played by hand. The markup carries `autoplay muted loop playsinline`
itself, so the section still works with JavaScript off; `app.js` only refines it
and draws the controls.

Images ship as WebP through `<picture>`, with the original JPG/PNG as the
fallback source — about 40% off the image payload with nothing lost on a browser
that cannot read WebP. `picture{display:contents}` keeps the `<img>` as the
layout box, so every existing CSS selector still applies. When you add an image,
add both files and wrap it the same way.

## How the demo form works

There is no backend. `app.js` validates the fields, then opens WhatsApp with the
enquiry pre-written to the sales number, with a `mailto:` link underneath for
anyone without WhatsApp. No spreadsheet, no Apps Script, no third-party form
service — the site holds no customer data at all.

This is a deliberate trade. An earlier build posted to a Google Apps Script
endpoint that wrote to a leads sheet, which meant a public endpoint anyone could
POST to and a spreadsheet full of names and phone numbers to look after. Handing
straight to WhatsApp removes both, at the cost of only capturing a lead once the
visitor actually presses send.

The hand-off runs synchronously inside the submit handler, which matters:
`window.open` is only allowed through while the submit that triggered it is
still the browser's active user gesture. Awaiting a network call first spends
that gesture and the popup blocker eats the WhatsApp tab.

## Content and claims

- Every product claim traces to `Petlabs Brochure_3.pdf` and
  `Petlab_Product_Technology_Deck-4.pptx`. Where the sources disagree — ~10 vs
  ~30 minute turnaround, slide 9's wider test menu — the majority reading is
  published and only agreed claims appear.
- **Named validators are AIIMS Delhi, the Indian Army, IIT Guwahati and GMCH
  Guwahati.** ICMR was removed from every validation claim on request — the trust
  ribbon, About copy, FAQ, JSON-LD, the `twitter:description` meta and the chat
  widget's scripted answers. `assets/partners/logo-icmr.png` remains in the folder but is
  unreferenced.
- The `trust__figures` numbers describe the **parent Mobilab platform in human
  diagnostics**, not the veterinary line. The page carries a note saying so — keep it.
- The chat widget is an interface preview with scripted answers. It says as much
  in the panel, and its header reads "Answers common questions" rather than
  implying someone is on the other end.
- Photography credits are in `assets/CREDITS.md`.

## Running it locally

```sh
cd vet-web-5.0
python3 -m http.server 8082
```

Then open <http://localhost:8082/>. Use a server rather than opening the file
directly — `file://` breaks the video elements and the form's fetch call.

Editing is direct: change the markup in the page, the tokens or components in
`styles.css`, the behaviour in `app.js`, and reload. There is nothing to compile
and nothing to install.
