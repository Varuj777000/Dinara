"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { PLATFORM_CONTACTS } from "@/lib/contacts";

const NAV = [
  { href: "/#categories", label: "Категории" },
  { href: "/#how", label: "Как это работает" },
  { href: "/#services", label: "Преимущества" },
  { href: "/#contact", label: "Контакты" },
];

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("dinara-theme", next);
  } catch {}
}

export function SiteHeader() {
  const isHome = usePathname() === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <div className="progress" id="scroll-progress" />
      <header className="header" id="site-header">
        <div className="container header__row">
          <Logo intro />

          {/* На главной большой поиск уже есть в первом экране */}
          {!isHome && (
            <Form action="/" className="search" role="search">
              <div className="search__field">
                <Icon name="search" />
                <input
                  className="search__input"
                  name="q"
                  type="search"
                  placeholder="Артикул детали, например GDB2372"
                  aria-label="Поиск по артикулу"
                  autoComplete="off"
                />
                <button className="search__btn" type="submit">
                  Найти
                </button>
              </div>
            </Form>
          )}

          <div className="actions">
            <a className="phone" href={PLATFORM_CONTACTS.phoneHref}>
              <span className="phone__ico">
                <Icon name="phone" />
              </span>
              <span>
                <b>{PLATFORM_CONTACTS.phoneDisplay}</b>
                <small>Поможем найти деталь</small>
              </span>
            </a>
            <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Переключить тему">
              <Icon name="moon" className="moon" />
              <Icon name="sun" className="sun" />
            </button>
            <button className="icon-btn burger" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">
              <Icon name="menu" />
            </button>
          </div>
        </div>

        <nav className="nav" aria-label="Основное меню">
          <div className="container nav__list">
            {NAV.map((item) => (
              <Link key={item.href} className="nav__link" href={item.href}>
                {item.label}
              </Link>
            ))}
            <span className="nav__spacer" />
            <span className="nav__note">
              <Icon name="compare" />
              Сравнение цен <b>без комиссии</b>
            </span>
          </div>
        </nav>
      </header>

      <div className={`drawer${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="drawer__scrim" onClick={() => setMenuOpen(false)} />
        <aside className="drawer__panel">
          <div className="drawer__top">
            <Logo />
            <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">
              <Icon name="close" />
            </button>
          </div>
          {NAV.map((item) => (
            <Link key={item.href} className="drawer__link" href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
              <Icon name="arrow" />
            </Link>
          ))}
          <div className="drawer__foot">
            <a className="btn btn--primary" href={PLATFORM_CONTACTS.phoneHref}>
              <Icon name="phone" />
              {PLATFORM_CONTACTS.phoneDisplay}
            </a>
            <a className="btn btn--ghost" href={PLATFORM_CONTACTS.whatsappHref}>
              <Icon name="chat" />
              Написать в WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
