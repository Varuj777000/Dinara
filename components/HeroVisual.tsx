"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

/** Вращающийся тормозной диск с плашками; слои слегка следуют за мышью. */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visual = ref.current;
    const hero = visual?.closest(".hero") as HTMLElement | null;
    if (!visual || !hero) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(pointer: fine)").matches) return;

    const layers = Array.from(visual.querySelectorAll<HTMLElement | SVGElement>("[data-depth]"));
    const onMove = (e: MouseEvent) => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      for (const l of layers) {
        const d = Number(l.dataset.depth);
        l.style.transform = `translate(${(-x * d).toFixed(1)}px, ${(-y * d).toFixed(1)}px)`;
      }
    };
    const onLeave = () => layers.forEach((l) => (l.style.transform = ""));
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const spokes = Array.from({ length: 12 }, (_, i) => i * 30);
  const bolts = Array.from({ length: 5 }, (_, i) => i * 72);

  return (
    <div className="visual" ref={ref} data-reveal="scale" style={{ "--d": "200ms" } as React.CSSProperties} aria-hidden="true">
      <span className="visual__glow" />
      <span className="visual__ring" />
      <span className="visual__ring visual__ring--2" />
      <svg className="visual__disc" data-depth="14" viewBox="0 0 420 420">
        <g className="disc-spin">
          <circle cx="210" cy="210" r="190" fill="url(#discGrad)" />
          <circle cx="210" cy="210" r="176" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
          <circle cx="210" cy="210" r="160" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
          <circle cx="210" cy="210" r="96" fill="#161a24" />
          <g fill="#0e1116" opacity=".85">
            {spokes.map((a) => (
              <ellipse key={a} cx="210" cy="75" rx="10" ry="24" transform={`rotate(${a} 210 210)`} />
            ))}
          </g>
          <circle cx="210" cy="210" r="66" fill="url(#hubGrad)" />
          <g fill="#1a1f2b">
            {bolts.map((a) => (
              <circle key={a} cx="210" cy="170" r="9" transform={`rotate(${a} 210 210)`} />
            ))}
          </g>
          <circle cx="210" cy="210" r="20" fill="url(#dGrad)" />
        </g>
        {/* Суппорт не вращается вместе с диском */}
        <path d="M358.3 131.2 A168 168 0 0 1 358.3 288.8" fill="none" stroke="url(#dGrad)" strokeWidth="38" strokeLinecap="round" />
        <path d="M352 140 A160 160 0 0 1 352 280" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="chip chip--1" data-depth="26">
        <i>
          <Icon name="compare" />
        </i>
        <span>
          Цены магазинов<small>на одном экране</small>
        </span>
      </div>
      <div className="chip chip--2" data-depth="34">
        <i>
          <Icon name="phone" />
        </i>
        <span>
          Звоните напрямую<small>без посредников</small>
        </span>
      </div>
      <div className="chip chip--3" data-depth="22">
        <i>
          <Icon name="barcode" />
        </i>
        <span>
          Точно по артикулу<small>бренд + номер детали</small>
        </span>
      </div>
    </div>
  );
}
