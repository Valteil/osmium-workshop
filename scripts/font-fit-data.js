// Hand-measured width-normalisation data shared by the site's font-fit
// (scripts/site-font-fit.js -> docs/assets/font-fit.css) and the app's
// (scripts/app-font-fit.js -> renderer/fonts/font-fit.css).
//
// RATIOS[role][family] is the reference face's advance width divided by the
// family's, for one fixed sample string, measured in-browser (canvas
// measureText). The reference faces are: display = Chakra Petch @600, body =
// IBM Plex Sans @400, mono = JetBrains Mono @400. A ratio of 1 means the
// family already matches the reference width. Re-measure if a theme's faces
// change. Don't enlarge a condensed display face past x1.2 (see each script).
'use strict';

const RATIOS = {
  display: { 'Albert Sans': 1.0072, 'Alegreya': 1.1561, 'Anybody': 0.9101, 'Audiowide': 0.8358, 'Barlow Semi Condensed': 1.1949,
    'Big Shoulders Display': 1.4579, 'Chakra Petch': 1, 'Cinzel': 0.8623, 'Epilogue': 0.9337, 'Fredoka': 1.0446, 'Gilda Display': 1.0487,
    'Gloock': 1.0333, 'IM Fell English SC': 1.0998, 'Marcellus SC': 1.0135, 'Michroma': 0.7358, 'Nunito': 1.0194, 'Overpass': 1.0235,
    'Oxanium': 0.9954, 'Pirata One': 1.3495, 'Poiret One': 1.0992, 'Saira Stencil One': 0.9836, 'Schibsted Grotesk': 0.9848,
    'Shippori Mincho': 0.9504, 'Sora': 0.9209, 'VT323': 1.2018, 'Zen Maru Gothic': 1.0685 },
  body: { 'Albert Sans': 0.9744, 'Alegreya Sans': 1.1807, 'Anybody': 0.9344, 'Archivo': 1.0287, 'Barlow': 1.0604, 'Barlow Condensed': 1.3336,
    'Barlow Semi Condensed': 1.1812, 'Epilogue': 0.9244, 'Exo 2': 0.9943, 'Figtree': 1.0029, 'Fredoka': 1.0051, 'IBM Plex Sans': 1,
    'JetBrains Mono': 0.7693, 'Jost': 1.0567, 'Karla': 0.9927, 'Libre Caslon Text': 0.9501, 'Nunito': 0.995, 'Overpass': 1.0131,
    'Oxanium': 0.974, 'Schibsted Grotesk': 0.972, 'Sora': 0.8968, 'Zen Kaku Gothic New': 1.0356, 'Zen Maru Gothic': 1.0354 },
  mono: { 'Courier Prime': 1.0007, 'JetBrains Mono': 1 }
};

// Ascent / descent (% of the font size) of the reference faces; every
// normalised face is forced to them so a `line-height: normal` line is the
// same height in every theme. Divided by the size-adjust factor because the
// overrides are themselves scaled by size-adjust (size-adjust * override =
// reference metric).
const METRICS = { display: [99, 31], body: [103, 28], mono: [102, 30] };

module.exports = { RATIOS, METRICS };
