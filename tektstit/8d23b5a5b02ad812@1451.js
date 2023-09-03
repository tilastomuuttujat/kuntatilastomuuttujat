function _1(md){return(
md`# The Image of Language

Playing with the concept described in Michael Winkler's [book](https://michaelwinklerart.com/publications/).`
)}

function _passage(Inputs){return(
Inputs.textarea({
  label: "Text",
  value: "The detail of the pattern is movement",
  rows: 5,
})
)}

function _3(width,sentences,maxHeight,svg,alphabet,coordinates,makeWordPath)
{
  let svgWidth = width;
  const spacing = 0.0;
  const margin = {
    left: 0.2,
    right: 0.2,
    top: 0.3,
    bottom: -0.1,
  }
  const w = 1.25;
  const h = 1.6;
  //const maxHeight = window.outerHeight - 250;
  const maxLength = Math.max(...sentences.map((d) => d.length))
  const ar = (w * maxLength + margin.left + margin.right) / (h * sentences.length + margin.top + margin.bottom)
  let svgHeight = svgWidth / ar;
  if (svgHeight > maxHeight) {
    svgHeight = maxHeight;
    svgWidth = svgHeight * ar;
  }
  return svg`
  <svg width=${svgWidth} height=${svgHeight} viewBox="-${margin.left} -${margin.top} ${w * maxLength + margin.left + margin.right} ${h * sentences.length + margin.top + margin.bottom}">
  <rect class="background" x="-${margin.left}" y="-${margin.top}" width="${w * maxLength + margin.left + margin.right}" height="${h * sentences.length + margin.top + margin.bottom}"/>
  ${sentences.map(function (sentence, j) {
    return svg`
  ${sentence.map(function (word, i) {
    return svg`${Array.from(alphabet).map(function (char) {
           const cx = w * i + w / 2 + 0.5 * coordinates.get(char)[0];
           const cy = h * j + 0.5 + 0.5 * coordinates.get(char)[1];
           return svg`<circle class="dot" cx="${cx}" cy="${cy}" r="${0.01}" />`
         })}`
  })}
  ${sentence.map(function (word, i) {
    return svg`${Array.from(alphabet).map(function (char) {
           const cx = w * i + w / 2 + (0.5 + 0.06) * coordinates.get(char)[0];
           const cy = h * j + 0.5 + (0.5 + 0.06) * coordinates.get(char)[1];
           const a = 90 + (coordinates.get(char)[2] * 180) / Math.PI;
           return svg`<text class="dot-label" text-anchor="middle" alignment-baseline="middle" transform="translate(${cx}, ${cy}) rotate(${a})">${char}</text>`;
         })}`
  })}
  ${sentence.map(function (word, i) {
    const cx = w * i + w / 2;
    const cy = h * j + 0.5;
    return svg`<text class="word" text-anchor="middle" alignment-baseline="middle" x="${cx}" y="${cy + 0.5 + .4 * (h - 1)}" >${word}</text>`
  })}
  ${sentence.map(function (word, i) {
    const cx = w * i + w / 2;
    const cy = h * j + 0.5;
    return svg`<circle class="border" cx="${cx}" cy="${cy}" r="0.5" />`
  })}
  ${sentence.map(function (word, i) {
    const cx = w * i + w / 2;
    const cy = h * j + 0.5;
    return svg`<path class="word-line" d="${makeWordPath(cx, cy, word)}" />`
  })}
  ${sentence.map(function (word, i) {
    const char = word[0];
    const cx = w * i + w / 2 + 0.5 * coordinates.get(char)[0];
    const cy = h * j + 0.5  + 0.5 * coordinates.get(char)[1];
    return svg`<circle class="start" cx="${cx}" cy="${cy}" r="${1}" />`
  })}`
  })}
</svg>`;
}


function _big(Inputs){return(
Inputs.range([5, 35], { value: 18, label: "top letter spacing (degrees)", step: 1 })
)}

function _maxHeight(Inputs){return(
Inputs.range([400, 2000], {label: "max height", value: window.outerHeight - 250, step: 1})
)}

function _6(md){return(
md`<br>

---

## Notes

Buy the book <a href="https://www.printedmatter.org/catalog/58738/">here</a> or check for <a href="https://www.bookfinder.com/search/?author=Winkler%2C+Michael&title=The+Image+of+Language%3A+An+Artist%27s+Memoir&lang=en&st=xl&ac=qr
">a used one</a>.

Some cool words: Aegilops, cremnophobia, bierstube, gymnoplast, galactic, eunoia

### Things to try maybe one day
- [x] could do lines from poetry in this style (it works by just pasting in the text in the text box)
  - https://www.poetryfoundation.org/poems/43311/sadie-and-maud
  - https://www.poetryfoundation.org/poems/42892/fireflies-in-the-garden
- [ ] repeating the same phrases with different ordering of letters around the circle?
- [ ] have ordering be based on regular shape for each word?
- [ ] use parallel lines instead of circle?
- [ ] spring layout of resulting “word networks”?
- [ ] what would the equivalent be for sentences?
- [ ] use types of letters? e.g. vowels/consonants
- [ ] or phonemes? see rhymes visually?

### Some links
- https://www.reddit.com/r/gifs/comments/huingi/the_visual_history_of_the_evolution_of_the/
- https://www.youtube.com/watch?v=3kGuN8WIGNc
- https://en.wikipedia.org/wiki/History_of_the_alphabet
- https://www.reddit.com/r/grammar/comments/xh9ukp/what_is_the_longest_word_containing_consecutive/
- https://xkcd.com/2794/

Could search for words that have interesting geometric/visual properties:
- longest without any crossings
- longest line / longest line per letter
- most imbalanced on right / left
- largest area
- symmetrical
- rings / no dangling lines
- purely clockwise / counter-clockwise
- group words that have the same shape

--- 
<br>`
)}

function _alphabet(){return(
"abcdefghijklmnopqrstuvwxyz"
)}

function _coordinates(makeWinklerCoordinates,alphabet,big){return(
makeWinklerCoordinates(alphabet, big)
)}

function _makeWinklerCoordinates(){return(
function makeWinklerCoordinates(alphabet, big) {
  const small = (360 - 8 * big) / 18;
  const angle = new Map();
  for (let i = 0; i < alphabet.length; i++) {
    if (i <= 8) {
      angle.set(alphabet[i], -90 + (i - 4) * big);
    } else {
      angle.set(alphabet[i], angle.get("i") + (i - 8) * small);
    }
  }
  const coords = new Map();
  for (let i = 0; i < alphabet.length; i++) {
    const x = (angle.get(alphabet[i]) * Math.PI) / 180;
    coords.set(alphabet[i], [Math.cos(x), Math.sin(x), x]);
  }
  return coords;
}
)}

function _makeShuffledCoordinates(_){return(
function makeShuffledCoordinates(alphabet) {
  const shuffled = _.shuffle(alphabet);
  const angle = new Map();
  for (let i = 0; i < alphabet.length; i++) {
    angle.set(shuffled[i], 360 * i / alphabet.length);
  }
  const coords = new Map();
  for (let i = 0; i < alphabet.length; i++) {
    const x = (angle.get(alphabet[i]) * Math.PI) / 180;
    coords.set(alphabet[i], [Math.cos(x), Math.sin(x), x]);
  }
  return coords;
}
)}

function _sentences(passage){return(
passage
  .replace(/[\p{P}$+<=>^`|~0-9]/gu, "")
  .toLowerCase()
  .split("\n")
  .map((d) => d.split(" ").filter((d) => d))
)}

function _makeWordPath(coordinates,d3){return(
function makeWordPath(cx, cy, word) {
  const result = [];
  for (let character of word) {
    let [x, y] = coordinates.get(character);
    result.push([cx + 0.5 * x, cy + 0.5 * y]);
  }
  return d3.line()(result);
}
)}

function _13(html)
{
  return html`
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&display=swap" rel="stylesheet">
<style>
  .background {
    fill: #201e1f;
  }
  path, circle {
    fill: none;
    stroke: black;
    stroke-width: 0.025;
    /*vector-effect: non-scaling-stroke;*/
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .word-line {
    stroke: #db93b1;
  }
  .dot {
    vector-effect: non-scaling-stroke;
    stroke-width: 2;
    stroke: none;
  }
  .word, .dot-label {
    text-anchor: middle;
    text-transform: uppercase;
    font-size: 0.1pt;
    font-family: "Work Sans", Alice, "DM Serif Display", "Archivo Narrow", Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
    fill: #588760;
  }
  .dot-label {
    font-size: 0.05pt;
  }
  .dot, .dot-label {
    fill: #6aaa75;
  }
  .start {
    stroke: none;
    fill: none;
  }
  .border {
    vector-effect: non-scaling-stroke;
    stroke-width: 1;
    fill: none;
    stroke: none;
    stroke-dasharray: 1 2;
  }
  .info {
    font-family: Menlo, Consolas, monospace;
  }
</style><p class="info">check here for stylez</p>`
}


function _14(md){return(
md`## Messing around with phonemes, too`
)}

async function _cmudict(d3,distance)
{
  const module = await import(
    "https://cdn.jsdelivr.net/gh/stdlib-js/datasets-cmudict@esm/index.mjs"
  );
  const cmudict = module.default;
  const all = cmudict({ data: "dict" });
  const firstLast = d3.group(Object.keys(all), (d) => d.at(0) + d.at(-1));
  function lookup(word) {
    let result = all[word];
    if (result) {
      return result;
    } else {
      let key = word.at(0) + word.at(-1);
      let candidates = firstLast.get(key);
      let minDistance = Infinity;
      let minWord = "HUH";
      candidates.forEach(function (c) {
        let d = distance(c, word);
        if (d <= minDistance) {
          minDistance = d;
          minWord = c;
        }
      });
      return all[minWord];
    }
  }
  return {
    dict: all,
    firstLast: firstLast,
    phones: cmudict({ data: "phones" }),
    symbols: cmudict({ data: "symbols" }),
    punctuation: cmudict({ data: "vp" }),
    lookup: lookup
  };
}


function _16(cmudict){return(
cmudict.lookup("CRUELLEST")
)}

function _17(cmudict){return(
cmudict.lookup("GENE")
)}

function _18(getPhones){return(
getPhones("GENE")
)}

function _19(cmudict){return(
cmudict.phones
)}

function _getPhones(cmudict){return(
function getPhones(text) {
  const words = text.toUpperCase().split(/[ -]+/);
  const result = [];
  words.forEach(function (word) {
    console.log(word);
    const noVariants = cmudict.lookup(word).replace(/\d+/g, "");
    result.push(...noVariants.split(" ").map((d) => cmudict.phones[d]));
  });
  return result;
}
)}

function _21(getPhones){return(
getPhones("hello world I am batman")
)}

function _22(cmudict){return(
new Set(Object.values(cmudict.phones))
)}

function _allPhones(sentences,getPhones,_){return(
sentences.map((s) => s.map(getPhones)).map(_.flatten)
)}

async function _distance()
{
  const module = await import(
    "https://cdn.skypack.dev/js-levenshtein@1.1.6?min"
  );
  return module.default;
}


function _maxPhoneLength(allPhones){return(
Math.max(...allPhones.map((d) => d.length))
)}

function _spacing(){return(
0.2
)}

function _27(phoneSize,spacing,maxPhoneLength,sentences,allPhones,svg,colorScale,htl){return(
htl.html`<svg width=${phoneSize.width/3} height=${phoneSize.height/3} viewBox="-0.1 -0.1 ${(2 + spacing) * maxPhoneLength + .2} ${(2 + spacing) * sentences.length + 0.2}">
  ${allPhones.map((line, j) => svg`
    ${line.map((phone, i) => svg`<rect class="phone" x="${(2 + spacing) * i}" y="${(2 + spacing) * j}" width="2" height="2" fill="${colorScale(phone)}"/>`)}
  `)}
</svg>`
)}

function _phoneSize(width,sentences,maxPhoneLength)
{
  let maxHeight = window.outerHeight - 250;
  let w = width;
  let h = width * (sentences.length / maxPhoneLength);
  if (h > maxHeight) {
    h = maxHeight;
    w = h * (maxPhoneLength / sentences.length);
  }
  return {
    width: w,
    height: h
  };
}


function _colorScale(d3,cmudict){return(
d3
  .scaleOrdinal()
  .domain(new Set(Object.values(cmudict.phones)))
  .range(d3.schemeAccent)
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof passage")).define("viewof passage", ["Inputs"], _passage);
  main.variable(observer("passage")).define("passage", ["Generators", "viewof passage"], (G, _) => G.input(_));
  main.variable(observer()).define(["width","sentences","maxHeight","svg","alphabet","coordinates","makeWordPath"], _3);
  main.variable(observer("viewof big")).define("viewof big", ["Inputs"], _big);
  main.variable(observer("big")).define("big", ["Generators", "viewof big"], (G, _) => G.input(_));
  main.variable(observer("viewof maxHeight")).define("viewof maxHeight", ["Inputs"], _maxHeight);
  main.variable(observer("maxHeight")).define("maxHeight", ["Generators", "viewof maxHeight"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _6);
  main.variable(observer("alphabet")).define("alphabet", _alphabet);
  main.variable(observer("coordinates")).define("coordinates", ["makeWinklerCoordinates","alphabet","big"], _coordinates);
  main.variable(observer("makeWinklerCoordinates")).define("makeWinklerCoordinates", _makeWinklerCoordinates);
  main.variable(observer("makeShuffledCoordinates")).define("makeShuffledCoordinates", ["_"], _makeShuffledCoordinates);
  main.variable(observer("sentences")).define("sentences", ["passage"], _sentences);
  main.variable(observer("makeWordPath")).define("makeWordPath", ["coordinates","d3"], _makeWordPath);
  main.variable(observer()).define(["html"], _13);
  main.variable(observer()).define(["md"], _14);
  main.variable(observer("cmudict")).define("cmudict", ["d3","distance"], _cmudict);
  main.variable(observer()).define(["cmudict"], _16);
  main.variable(observer()).define(["cmudict"], _17);
  main.variable(observer()).define(["getPhones"], _18);
  main.variable(observer()).define(["cmudict"], _19);
  main.variable(observer("getPhones")).define("getPhones", ["cmudict"], _getPhones);
  main.variable(observer()).define(["getPhones"], _21);
  main.variable(observer()).define(["cmudict"], _22);
  main.variable(observer("allPhones")).define("allPhones", ["sentences","getPhones","_"], _allPhones);
  main.variable(observer("distance")).define("distance", _distance);
  main.variable(observer("maxPhoneLength")).define("maxPhoneLength", ["allPhones"], _maxPhoneLength);
  main.variable(observer("spacing")).define("spacing", _spacing);
  main.variable(observer()).define(["phoneSize","spacing","maxPhoneLength","sentences","allPhones","svg","colorScale","htl"], _27);
  main.variable(observer("phoneSize")).define("phoneSize", ["width","sentences","maxPhoneLength"], _phoneSize);
  main.variable(observer("colorScale")).define("colorScale", ["d3","cmudict"], _colorScale);
  return main;
}
