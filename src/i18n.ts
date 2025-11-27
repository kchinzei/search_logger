//    The MIT License (MIT)
//    Copyright (c) Kiyo Chinzei (kchinzei@gmail.com)
//
//     Permission is hereby granted, free of charge, to any person obtaining a copy
//    of this software and associated documentation files (the "Software"), to deal
//    in the Software without restriction, including without limitation the rights
//    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//    copies of the Software, and to permit persons to whom the Software is
//    furnished to do so, subject to the following conditions:
//    The above copyright notice and this permission notice shall be included in
//    all copies or substantial portions of the Software.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//    THE SOFTWARE.

let strings: any = {}; // You can later define a stricter type

export async function setLanguage(lang: string): Promise<void> {
  const res = await fetch(`lang/${lang}.json`);
  if (!res.ok) throw new Error(`Translation file not found: ${lang}`);
  strings = await res.json();
}

export function t(key: string): string | undefined {
  const val = key.split(".").reduce((obj, part) => obj?.[part], strings);
  // if (!val) console.warn(`Missing translation: ${key}`);
  return val;
}

export function makePrefixer(
  prefix: string,
): (key: string) => string | undefined {
  return (key: string) => t(`${prefix}.${key}`);
}

export function makePrefixer2(prefix: string): (key: string) => string {
  // Always return a string
  const p = makePrefixer(prefix);
  return (key: string) => {
    const val = p(key);
    return val !== undefined ? val : `${prefix}.${key}`;
  };
}

export function applyTexts(keys: string[], prefix = ""): void {
  const tp = makePrefixer(prefix);
  for (const k of keys) {
    const el = document.getElementById(k);
    if (el) {
      const val = tp(k);
      if (val !== undefined) {
        el.textContent = val;
      }
    }
  }
}

export function autoTranslate(prefix = ""): void {
  const tp = makePrefixer(prefix);
  document.querySelectorAll("[id]").forEach((el) => {
    if (el instanceof HTMLElement) {
      const val = tp(el.id);
      if (val !== undefined) {
        el.textContent = val;
      }
    }
  });
}
