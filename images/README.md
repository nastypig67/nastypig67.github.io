# Photos

Every image on the site right now is a placeholder — a coloured `.svg` card
that says "replace me". Nothing here is a real photo.

## Swapping in a real photo

1. Put your photo in this `images/` folder. Keep the same base name as the
   placeholder you're replacing, e.g. `photo-03.jpg` replaces `photo-03.svg`.
2. Open `index.html` and find that filename. Change the extension `.svg` →
   `.jpg` (or `.png`, `.webp` — whatever your file is).
   - For gallery and dog photos there are **two** places on the same line:
     `data-full="images/photo-03.svg"` on the `<button>` and
     `src="images/photo-03.svg"` on the `<img>`. Change both.
   - For hero and side photos there is only the `src`.
3. Update the `alt` text on the `<img>` to describe what's in the picture,
   and the `<figcaption>` text to whatever caption you want under it.
4. Delete the leftover `.svg` once you no longer need it.

## Which file is where

| Files | Where they appear |
|---|---|
| `hero-01` … `hero-05` | the floating collage on the Home tab |
| `photo-01` … `photo-15` | the Photos gallery |
| `dog-01` … `dog-05` | the photo strip on the My Dog tab |
| `side-01` … `side-04` | the tall photo beside Facts, Opinions, Life Updates, Contact |

## Sizes

- Aim for roughly **1000–1600px** on the long edge. Bigger just makes the
  page slower to load; the site never displays them larger than that.
- Save JPEGs at around 80% quality. A good photo lands under ~300KB.
- The `width` and `height` attributes in `index.html` only need to match your
  photo's **aspect ratio**, not its exact pixels — they stop the page jumping
  around while images load. If your new photo has a very different shape from
  the placeholder, update those two numbers too.

## Adding more photos than there are slots

Copy a whole `<figure class="shot ...">…</figure>` line in `index.html`,
paste it after the last one, bump the `--i:` number (it staggers the
animation), and point it at your new file. The grid reflows on its own.
