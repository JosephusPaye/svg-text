export type ElementAttrs = Record<string, string | number>;

interface Run {
  text: string;
  after: string[];
}

interface UserLine {
  line: string;
  runs: Run[];
}

export interface TextMeasure {
  width: number;
  height: number;
}

export interface MeasuredLine {
  text: string;
  measure: TextMeasure;
  position: {
    x: number;
    y: number;
  };
}

interface WrappedLine {
  line: string;
  wrapped: MeasuredLine[];
}

export interface LineGroup {
  width: number;
  height: number;
  lines: MeasuredLine[];
}

/**
 * Convert the given camelCased string to snake-case
 */
function camelToSnake(str: string, delimiter = '-') {
  return str.replace(
    /[A-Z]/g,
    (letter) => `${delimiter}${letter.toLowerCase()}`
  );
}

/**
 * Create markup for the given element, children, and attributes
 */
export function createElement(
  element: keyof SVGElementTagNameMap,
  children: string,
  attrs: ElementAttrs
) {
  const attributes = Object.keys(attrs)
    .map((key) => {
      return `${camelToSnake(key)}="${attrs[key]}"`;
    })
    .join(' ');

  return `<${element} ${attributes}>${children}</${element}>`;
}

/**
 * Append the given HTML offscreen in the DOM, run the given callback
 * with the element in the DOM, and then remove the element.
 * Returns whatever the callback returns.
 */
function appendTemporarily<T>(
  html: string,
  callback: (element: HTMLDivElement) => T
): T {
  const tempEl = document.createElement('div');
  tempEl.style.position = 'absolute';
  tempEl.style.visibility = 'hidden';

  tempEl.innerHTML = html;
  document.body.appendChild(tempEl);

  const callbackReturn = callback(tempEl);

  tempEl.remove();

  return callbackReturn;
}

/**
 * Measure the given array of texts by converting them to SVG
 * <text> elements, temporarily appending to the DOM, and
 * measuring their rendered bounding boxes.
 *
 * `fontAttrs` is an object of SVG `font-*` attributes for
 * the rendered <text> elements.
 */
export function measureText(
  texts: string[],
  fontAttrs: ElementAttrs
): TextMeasure[] {
  const text = texts
    .map((text) => {
      return createElement('text', text, fontAttrs);
    })
    .join('\n');

  const svg = createElement('svg', text, {
    viewbox: '0 0 1920 1080',
    x: 0,
    y: 0,
  });

  return appendTemporarily(svg, (tempEl) => {
    return Array.from(tempEl.querySelectorAll('text')).map((textEl) => {
      const { width, height } = textEl.getBBox();
      return { width, height };
    });
  });
}

// Non-breaking space character
const NBSP = '\u00A0';

/**
 * Given an array of words, create a list of all runs.
 * A run is all the words from the start to a word.
 *
 * For example, "how are you" has three runs:
 *  - "how"
 *  - "how are"
 *  - "how are you"
 */
function createRuns(words: string[]): Run[] {
  return (
    words
      // Map each word into a run
      .map((_, index) => {
        return {
          text: words.slice(0, index + 1).join(NBSP),
          after: words.slice(index + 1),
        };
      })
      // Runs with empty text are excluded
      .filter((run) => run.text.length > 0)
  );
}

/**
 * Given a list of runs, find the longest run that fits in a box with the
 * given max width, and find the remaining words. The longest fitting
 * run becomes a "line", with a measured width and height.
 */
function wrapLineSingle(
  runs: Run[],
  maxWidth: number,
  fontAttrs: ElementAttrs
) {
  const measuredRuns = measureText(
    runs.map((r) => r.text),
    fontAttrs
  )
    .map((measure, index) => {
      return {
        ...runs[index],
        measure,
      };
    })
    .sort((a, z) => {
      return z.measure.width - a.measure.width;
    });

  const longestFittingIndex = measuredRuns.findIndex((run) => {
    return run.measure.width <= maxWidth;
  });

  // if we don't have any that fit, pick the smallest (last) one
  const longestFitting =
    measuredRuns[longestFittingIndex] || measuredRuns[measuredRuns.length - 1];

  return {
    line: {
      text: longestFitting.text,
      measure: longestFitting.measure,
      position: { x: 0, y: 0 },
    },
    remainingRuns: createRuns(longestFitting.after),
  };
}

/**
 * Given a list of user lines and a max width, wrap the words inside
 * each user line to fit in a box with the given max width. Returns
 * the original user lines and the lines it was wrapped into, with
 * a measured width and height for each wrapped line.
 */
function wrapLines(
  userLines: UserLine[],
  maxWidth: number,
  fontAttrs: ElementAttrs
): WrappedLine[] {
  return userLines.map((userLine) => {
    const wrappedLines: MeasuredLine[] = [];

    let next = wrapLineSingle(userLine.runs, maxWidth, fontAttrs);
    wrappedLines.push(next.line);

    while (next.remainingRuns.length > 0) {
      next = wrapLineSingle(next.remainingRuns, maxWidth, fontAttrs);
      wrappedLines.push(next.line);
    }

    return {
      line: userLine.line,
      wrapped: wrappedLines,
    };
  });
}

/**
 * Given some text with hard line breaks (which form "user lines"), lay the
 * text out into lines by fitting each user line into a box with the given
 * max width. Returns the user lines and the lines they were wrapped into
 * with a measured width and height for each wrapped line.
 */
function layoutLines(text: string, maxWidth: number, fontAttrs: ElementAttrs) {
  let userLines = text
    .replace(/ /g, NBSP)
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const words = line.split(NBSP);
      return {
        line,
        runs: createRuns(words),
      };
    });

  return wrapLines(userLines, maxWidth, fontAttrs);
}

/**
 * Layout the given text to fit the given constraints, with line
 * wrapping and line spacing. Returns groups of lines each with
 * no more than `constraints.maxLines` number of lines.
 */
export function layoutText(
  text: string,
  constraints: { maxWidth: number; maxLines: number },
  fontAttrs: ElementAttrs,
  lineAttrs: { lineSpacing: number }
) {
  const userLines = layoutLines(text, constraints.maxWidth, fontAttrs);
  const allLines: MeasuredLine[] = [];

  for (const userLine of userLines) {
    allLines.push(...userLine.wrapped);
  }

  const lineGroups: LineGroup[] = [];

  chunk(allLines, constraints.maxLines, (chunk) => {
    const lines = [];

    let width = 0;
    for (const line of chunk) {
      width = Math.max(width, line.measure.width);
      lines.push(line);
    }

    let y = 0;
    for (const line of lines) {
      line.position = { x: 0, y };
      y += line.measure.height + lineAttrs.lineSpacing;
    }

    lineGroups.push({
      width,
      height: y - lineAttrs.lineSpacing,
      lines,
    });
  });

  return lineGroups;
}

/**
 * Process the given array in chunks.
 */
function chunk<T>(
  array: T[],
  chunkSize: number,
  processChunk: (chunk: T[], index: [number, number], array: T[]) => void
) {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    processChunk(chunk, [i, i + chunkSize], array);
  }
}
