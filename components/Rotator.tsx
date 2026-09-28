"use client";

import { useEffect, useRef } from "react";

/** Слово, которое плавно сменяется по кругу (например, бренды из каталога). */
export function Rotator({ words, interval = 2400 }: { words: string[]; interval?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || words.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let swap: number | undefined;
    const id = window.setInterval(() => {
      el.classList.add("is-out");
      swap = window.setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove("is-out");
        el.classList.add("is-in");
        void el.offsetWidth; // перезапуск перехода снизу вверх
        el.classList.remove("is-in");
      }, 380);
    }, interval);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(swap);
    };
  }, [words, interval]);

  return (
    <span className="rotator">
      <span className="rotator__word" ref={ref}>
        {words[0]}
      </span>
    </span>
  );
}
