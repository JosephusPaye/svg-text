# svg-text

> Measure and wrap text into lines for SVG in the browser.

This project is part of [#CreateWeekly](https://twitter.com/JosephusPaye/status/1214853295023411200), my attempt to create something new publicly every week in 2020.

## Installation

```bash
npm install -g @josephuspaye/svg-text
```

## Examples

### Measure text

The following example shows how to measure strings of text (runs in the browser):

```js
import { measureText } from '@josephuspaye/svg-text';

const measures = measureText(['nyan', 'oh hai mark'], {
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontWeight: 'bold',
  fontSize: '2em',
});

console.log(measures[0]); // measure for 'nyan': { width: '', height: '' }
console.log(measures[1]); // measure for 'oh hai mark': { width: '', height: '' }
```

### Layout text by wrapping into lines

```js
import { layoutText } from '@josephuspaye/svg-text';

const lines = layoutText(
  "The tired teacher told Tom to take thirty-three tables to the townhall. Despite drowsiness, Dorothy dove deep down the dark and dank drain to dig out Dave's damaged diary.",
  { maxWidth: 100, maxLines: 2 },
  {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontWeight: 'bold',
    fontSize: '2em',
  },
  {
    lineSpacing: 8,
  }
);

console.log(lines);
```

## API

```ts
type ElementAttrs = Record<string, string | number>;

interface TextMeasure {
  width: number;
  height: number;
}

interface MeasuredLine {
  text: string;
  measure: TextMeasure;
  position: {
    x: number;
    y: number;
  };
}

interface LineGroup {
  width: number;
  height: number;
  lines: MeasuredLine[];
}

/**
 * Measure the given array of texts by converting them to SVG
 * <text> elements, temporarily appending to the DOM, and
 * measuring their rendered bounding boxes.
 *
 * `fontAttrs` is an object of SVG `font-*` attributes for
 * the rendered <text> elements.
 */
function measureText(texts: string[], fontAttrs: ElementAttrs): TextMeasure[];

/**
 * Layout the given text to fit the given constraints, with line
 * wrapping and line spacing. Returns groups of lines each with
 * no more than `constraints.maxLines` number of lines.
 */
function layoutText(
  text: string,
  constraints: {
    maxWidth: number;
    maxLines: number;
  },
  fontAttrs: ElementAttrs,
  lineAttrs: {
    lineSpacing: number;
  }
): LineGroup[];
```

## Licence

[MIT](LICENCE)
