# Deploying Petlab · vet-web-5.0

Static HTML/CSS/JS. No build step, no dependencies, no environment variables.
For what the site actually is, see [README.md](README.md).

`.gitlab-ci.yml` publishes to **GitLab Pages** on every push to the default
branch. Nothing else is needed — if Pages is enabled on the instance, merging to
`main` deploys. Watch the `pages` job in **Build → Pipelines**.

To serve it from anywhere else instead, copy these to the web root:

    index.html  duo.html  styles.css  app.js  robots.txt  sitemap.xml  assets/

## Domain

Every `canonical` / `og:url` / JSON-LD tag, plus `robots.txt` and `sitemap.xml`,
hardcodes **https://petlab.in/**. If the site goes live anywhere else,
update those first or search engines will index the wrong host:

```sh
grep -rn "petlab.in" index.html duo.html robots.txt sitemap.xml
```

On GitLab Pages set the custom domain under **Settings → Pages → New Domain**.

## The demo form

The form has no backend. On submit, `app.js` opens WhatsApp with the enquiry
already written out, addressed to the sales number in `WHATSAPP`, and offers a
`mailto:` to `NOTIFY_EMAIL` underneath for anyone without WhatsApp. Nothing is
stored: no spreadsheet, no Apps Script, no third-party form service. There is
nothing to wire up at deploy time and no customer data at rest anywhere outside
WhatsApp itself.

This is the intended state, not a gap. An earlier build posted to an Apps Script
`/exec` endpoint that wrote to a leads sheet, with a Google Form chain behind it;
`DEMO_ENDPOINT`, that fallback chain and `apps-script.gs` were all deleted on
purpose. A diff that removes them is this repository arriving at its intended
state, not regressing from it.

The consequence worth knowing: **a lead only exists once the visitor presses
send in WhatsApp.** If they close the tab at that point, nothing reaches you and
there is no record of the attempt. That is the trade for holding no customer
data — accept it deliberately, not by accident.

To change where enquiries go, edit `WHATSAPP` (digits, with country code) or
`NOTIFY_EMAIL` in `app.js`. Both pages share that file.

## Deploy checklist

- [ ] Submit tested end to end: the form opens WhatsApp with the details filled in
- [ ] `WHATSAPP` in `app.js` points at the number that should receive enquiries
- [ ] Replace `https://petlab.in/` in the canonical, Open Graph and JSON-LD
      tags of both pages if the real domain differs
- [ ] Serve over HTTPS
- [ ] Submit `sitemap.xml` in Google Search Console
