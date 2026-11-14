# Good in the Hood 🧡

A cosy little food relief game for the Good in the Hood crew. Made with love by Gabi.

**Play:** https://gabifav.github.io/good-in-the-hood/

Pick your avatar from the crew (or make a new volunteer), customise your outfit, then choose:

- **Work mode:** pack bags for Groups 1–6B and Pick up Only, bake pumpkin tarts at the cooking workshop, hand pick-up bags to visitors and send off the van.
- **Home mode:** leftover cook-ups, grow herbs, put your feet up, change outfits and pat Bowie.

Works on phones and computers. On a phone, "Add to Home Screen" installs it like an app, and it keeps working offline after the first visit. Progress saves automatically in each browser.

## Meal labels

https://gabifav.github.io/good-in-the-hood/labels/ makes print-ready PDFs for Avery L7157 sheets (33 per sheet), so labels can be printed straight from a phone. Each label shows the meal name, dietary info (if any) and packed date. You can upload the mail-merge spreadsheet (.xlsx/.csv) or paste rows from it. Do a plain-paper alignment test first; nudge settings are remembered per device. The page lives in `game-src/public/labels/`.

## Changing things

Everything lives in `game-src/`:

- `game-src/src/config/team.ts`: the crew's names, looks, starting outfits and what they say, plus how many bags each group needs.
- `game-src/src/world/maps.ts`: the layout of the hub and the flat.
- All art is drawn in code (`game-src/src/gfx/`), with no image files.

To rebuild after editing:

```sh
cd game-src
npm install
npm run build   # writes the playable game to the repo root
```

Then commit and push; GitHub Pages serves the root of `main`.
