"use client";

import { useEffect } from "react";

/**
 * Живые эффекты всего сайта, без собственной разметки:
 *  - снимает прелоадер (класс `is-ready` на <html>) и запоминает показ на сессию;
 *  - тень шапки и полоска прогресса при прокрутке;
 *  - появление блоков [data-reveal] и отсчёт чисел [data-count] при попадании в экран.
 * Новые элементы после клиентской навигации подхватываются автоматически.
 */
export function SiteEffects() {
  // Прелоадер
  useEffect(() => {
    const root = document.documentElement;
    const t = window.setTimeout(() => {
      root.classList.add("is-ready");
      try {
        sessionStorage.setItem("dinara-intro", "1");
      } catch {}
    }, 700);
    return () => window.clearTimeout(t);
  }, []);

  // Шапка и прогресс
  useEffect(() => {
    const header = document.getElementById("site-header");
    const bar = document.getElementById("scroll-progress");
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      header?.classList.toggle("is-scrolled", y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Появление и счётчики
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const countUp = (el: HTMLElement) => {
      if (el.dataset.done) return;
      el.dataset.done = "1";
      const to = Number(el.dataset.count);
      if (!Number.isFinite(to) || reduce) return; // сервер уже отрисовал итоговое число
      const fmt = new Intl.NumberFormat("ru-RU");
      const t0 = performance.now();
      const dur = 1600;
      const step = (t: number) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = fmt.format(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = "0";
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const el = en.target as HTMLElement;
          el.classList.add("is-visible");
          io.unobserve(el);
          el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    const scan = () =>
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => io.observe(el));
    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
