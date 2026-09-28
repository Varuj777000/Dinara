import Link from "next/link";

/**
 * Логотип Dinara: буква «D» с шестерёнкой внутри.
 * Градиент `dGrad` объявлен один раз в <SvgDefs /> (app/layout.tsx).
 * `intro` — буквы и шестерёнка анимируются при первой загрузке страницы
 * (запускается классом `is-ready` на <html>, см. Preloader).
 */
export function LogoMark({ className = "logo__mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <g transform="skewX(-6) translate(3 0)">
        <path d="M7 5h15c13 0 20 8 20 19s-7 19-20 19H7z" fill="url(#dGrad)" />
        <g className="logo__gear">
          <circle cx="23" cy="24" r="10" fill="none" stroke="#fff" strokeWidth="4.2" strokeDasharray="3.6 4.25" />
          <circle cx="23" cy="24" r="8" fill="#fff" />
          <circle cx="23" cy="24" r="3.4" fill="url(#dGrad)" />
        </g>
      </g>
    </svg>
  );
}

export function Logo({ intro = false }: { intro?: boolean }) {
  return (
    <Link className={`logo${intro ? " logo--intro" : ""}`} href="/" aria-label="Dinara — на главную">
      <LogoMark />
      <span className="logo__word" aria-hidden="true">
        {"DINARA".split("").map((ch, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties}>
            {ch}
          </span>
        ))}
      </span>
    </Link>
  );
}

/** Общие градиенты для логотипа и тормозного диска на главной. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="dGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9A5C" />
          <stop offset="1" stopColor="#FF5A1F" />
        </linearGradient>
        <linearGradient id="discGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a5266" />
          <stop offset="0.5" stopColor="#2a3142" />
          <stop offset="1" stopColor="#1a1f2b" />
        </linearGradient>
        <linearGradient id="hubGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7a839a" />
          <stop offset="1" stopColor="#363d50" />
        </linearGradient>
      </defs>
    </svg>
  );
}
