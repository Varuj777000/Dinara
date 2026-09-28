/**
 * Категории для витрины на главной. Пока это не отдельная модель в базе —
 * каждая категория просто ищет по ключевому слову в наименовании (тот же
 * режим, что и обычный поиск «по названию»). Ключевые слова подобраны и
 * проверены на реальном прайсе `data/tiko.xlsx`.
 */
export type Category = {
  slug: string;
  label: string;
  keyword: string;
  icon: React.ReactNode;
};

export const CATEGORIES: Category[] = [
  {
    slug: "raskhodniki",
    label: "Расходники",
    keyword: "фильтр",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2" stroke="currentColor" className="h-9 w-9">
        <rect x="14" y="6" width="20" height="26" rx="3" strokeLinejoin="round" />
        <path d="M18 13h12M18 19h12M18 25h8" strokeLinecap="round" />
        <path d="M20 32v6M28 32v6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "tormoznaya-sistema",
    label: "Тормозная система",
    keyword: "тормоз",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2" stroke="currentColor" className="h-9 w-9">
        <circle cx="24" cy="24" r="16" />
        <circle cx="24" cy="24" r="6" />
        <circle cx="24" cy="11" r="1.6" fill="currentColor" />
        <circle cx="35" cy="18.5" r="1.6" fill="currentColor" />
        <circle cx="35" cy="29.5" r="1.6" fill="currentColor" />
        <circle cx="24" cy="37" r="1.6" fill="currentColor" />
        <circle cx="13" cy="29.5" r="1.6" fill="currentColor" />
        <circle cx="13" cy="18.5" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    slug: "dvigatel-vykhlop",
    label: "Двигатель и выхлоп",
    keyword: "двигател",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2" stroke="currentColor" className="h-9 w-9">
        <rect x="8" y="18" width="20" height="16" rx="2" strokeLinejoin="round" />
        <path d="M13 18v-6h10v6" strokeLinejoin="round" />
        <path d="M28 22h6a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 26h6M13 30h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "podveska-rulevoe",
    label: "Подвеска и рулевое",
    keyword: "подвеск",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2" stroke="currentColor" className="h-9 w-9">
        <path d="M18 6c8 3 4 6 12 9s4 6 12 9" strokeLinecap="round" transform="translate(0 4)" />
        <circle cx="16" cy="10" r="2.5" />
        <circle cx="32" cy="38" r="2.5" />
      </svg>
    ),
  },
  {
    slug: "korobka-peredach",
    label: "Коробка передач",
    keyword: "кпп",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2" stroke="currentColor" className="h-9 w-9">
        <rect x="9" y="14" width="30" height="20" rx="3" strokeLinejoin="round" />
        <circle cx="24" cy="24" r="6" />
        <path d="M24 18v-4M24 30v-3M18 24h-3M30 24h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "okhlazhdenie",
    label: "Охлаждение",
    keyword: "радиатор",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2" stroke="currentColor" className="h-9 w-9">
        <rect x="8" y="10" width="32" height="24" rx="2" strokeLinejoin="round" />
        <path d="M14 10v24M20 10v24M26 10v24M32 10v24" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "elektrika-osveshchenie",
    label: "Электрика, освещение",
    keyword: "датчик",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2" stroke="currentColor" className="h-9 w-9">
        <path d="M25 6 12 27h10l-4 15 17-23H25l4-13z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "kuzov",
    label: "Кузов",
    keyword: "капот",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2" stroke="currentColor" className="h-9 w-9">
        <path d="M6 30c2-9 8-14 18-14s16 5 18 14v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3z" strokeLinejoin="round" />
        <circle cx="14" cy="35" r="3" />
        <circle cx="34" cy="35" r="3" />
      </svg>
    ),
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
