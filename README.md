# svg-text

> Measure and wrap text into lines for SVG in the browser.

This project is part of [#CreateWeekly](https://twitter.com/JosephusPaye/status/1214853295023411200), my attempt to create something new publicly every week in 2020.

## Installation

```bash
npm install -g @josephuspaye/svg-text
```

## Usage

### Measure text

The following example shows how to measure strings of text (runs in the browser):

```js
import { measureText } from '@josephuspaye/svg-text';

const measures = measureText(['nyan', 'oh hai mark'], {
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontWeight: 'bold',
  fontSize: '2em',
});

console.log(`measure for 'nyan':`, measures[0]);
console.log(`measure for 'oh hai mark':`, measures[1]);
```

<details>
<summary>View output</summary>

```
measure for 'nyan': { width: 74.6875, height: 35.21875 }
measure for 'oh hai mark': { width: 180.21875, height: 35.21875 }
```

</details>

### Wrap text

```js
import { layoutText } from '@josephuspaye/svg-text';

const lines = layoutText(
  'The tired teacher told Tom to take thirty-three tables to the townhall.',
  { maxWidth: 300, maxLines: 2 },
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

<details>
<summary>View output</summary>

```js
[
  {
    width: 259.015625,
    height: 78.4375,
    lines: [
      {
        text: 'The tired teacher',
        measure: {
          width: 259.015625,
          height: 35.21875,
        },
        position: {
          x: 0,
          y: 0,
        },
      },
      {
        text: 'told Tom to take',
        measure: {
          width: 244.734375,
          height: 35.21875,
        },
        position: {
          x: 0,
          y: 43.21875,
        },
      },
    ],
  },
  {
    width: 270.28125,
    height: 78.4375,
    lines: [
      {
        text: 'thirty-three tables',
        measure: {
          width: 270.28125,
          height: 35.21875,
        },
        position: {
          x: 0,
          y: 0,
        },
      },
      {
        text: 'to the townhall.',
        measure: {
          width: 234.640625,
          height: 35.21875,
        },
        position: {
          x: 0,
          y: 43.21875,
        },
      },
    ],
  },
];
```

</details>

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
