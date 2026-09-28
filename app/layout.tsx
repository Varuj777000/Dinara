import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Unbounded, Geist_Mono } from "next/font/google";
import { PLATFORM_CONTACTS } from "@/lib/contacts";
import { CATEGORIES } from "@/lib/categories";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteEffects } from "@/components/SiteEffects";
import { Logo, LogoMark, SvgDefs } from "@/components/Logo";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"] });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: {
    default: "Dinara — поиск автозапчастей по артикулу",
    template: "%s — Dinara",
  },
  description: "Dinara: сравнение цен и наличия автозапчастей по артикулу в магазинах-участниках. Звоните продавцу напрямую, без комиссии.",
};

/**
 * Выполняется до отрисовки: тема (сохранённая или системная), флаг `js`
 * для анимаций появления и пропуск прелоадера, если он уже показывался в этой сессии.
 */
const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');var t=null;try{t=localStorage.getItem('dinara-theme')}catch(e){}var dark=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;d.setAttribute('data-theme',dark?'dark':'light');try{if(sessionStorage.getItem('dinara-intro'))d.classList.add('is-ready')}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      data-theme="light"
      className={`${manrope.variable} ${unbounded.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <SvgDefs />
        <div className="preloader" aria-hidden="true">
          <div className="preloader__inner">
            <LogoMark />
            <div className="preloader__word">DINARA</div>
            <div className="preloader__bar" />
          </div>
        </div>
        <SiteEffects />
        <SiteHeader />

        <main>{children}</main>

        <footer className="footer">
          <div className="container">
            <div className="footer__grid">
              <div>
                <Logo />
                <p>Поиск автозапчастей по артикулу: цены и наличие нескольких магазинов на одном экране.</p>
              </div>
              <div>
                <h4>Каталог</h4>
                <ul>
                  {CATEGORIES.slice(0, 5).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/category/${c.slug}`}>{c.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Покупателям</h4>
                <ul>
                  <li>
                    <Link href="/#how">Как это работает</Link>
                  </li>
                  <li>
                    <Link href="/#services">Преимущества</Link>
                  </li>
                  <li>
                    <Link href="/#categories">Все категории</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4>Контакты</h4>
                <ul>
                  <li>
                    <a href={PLATFORM_CONTACTS.phoneHref}>{PLATFORM_CONTACTS.phoneDisplay}</a>
                  </li>
                  <li>
                    <a href={PLATFORM_CONTACTS.whatsappHref}>WhatsApp</a>
                  </li>
                  <li>
                    <a href={PLATFORM_CONTACTS.telegramHref}>Telegram {PLATFORM_CONTACTS.telegramDisplay}</a>
                  </li>
                  <li>
                    <span>{PLATFORM_CONTACTS.city}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="footer__bottom">
              <span>© {new Date().getFullYear()} Dinara</span>
              <span>Цены и наличие указывают магазины-участники</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
