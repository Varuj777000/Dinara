/**
 * Нормализация артикулов и брендов — сердце сопоставления товаров между магазинами.
 * Любое изменение здесь меняет ключи товаров, поэтому правки требуют переимпорта.
 */

/**
 * Кириллические буквы, визуально неотличимые от латинских. В прайсах их набирают
 * вперемешку: "ТРВ" вместо "TRW", русская "С" внутри латинского артикула.
 * Без этой замены одна деталь разъезжается на две карточки.
 */
const LOOKALIKE: Record<string, string> = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H",
  О: "O", Р: "P", С: "C", Т: "T", У: "Y", Х: "X",
};

function foldLookalikes(s: string): string {
  return s.replace(/[АВЕКМНОРСТУХ]/g, (ch) => LOOKALIKE[ch]);
}

/** Excel превращает артикул из одних цифр в число: "97472" становится 97472.0 */
export function looksNumeric(raw: unknown): boolean {
  if (typeof raw === "number") return true;
  return /^\d+(\.0+)?$/.test(String(raw ?? "").trim());
}

/**
 * Приводит артикул к ключу поиска: "GDB-1330", "gdb 1330", "GDB.1330" -> "GDB1330".
 * Возвращает пустую строку, если артикула фактически нет.
 */
export function normalizeArticle(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let s = String(raw).trim();
  if (!s) return "";

  // Числовая ячейка Excel: 97472 -> "97472", 13046071842 -> "13046071842"
  if (typeof raw === "number") {
    s = Number.isInteger(raw) ? raw.toFixed(0) : String(raw);
  }
  // Строка вида "97472.0", пришедшая из числовой ячейки
  if (/^\d+\.0+$/.test(s)) s = s.split(".")[0];
  // Научная нотация для очень длинных номеров: "1.3046071842e+10"
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) s = Number(s).toFixed(0);

  return foldLookalikes(s.toUpperCase()).replace(/[^A-Z0-9]/g, "");
}

/** Как показывать артикул человеку: без мусора, но с сохранением дефисов. */
export function displayArticle(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let s = String(raw).trim();
  if (typeof raw === "number") s = Number.isInteger(raw) ? raw.toFixed(0) : String(raw);
  if (/^\d+\.0+$/.test(s)) s = s.split(".")[0];
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) s = Number(s).toFixed(0);
  return s.replace(/\s+/g, " ").trim().toUpperCase();
}

/** Ключ бренда: "Mercedes-Benz", "MERCEDES-BENZ", "Mercedes benz" -> "MERCEDESBENZ" */
export function normalizeBrand(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return foldLookalikes(s.toUpperCase()).replace(/[^A-Z0-9]/g, "");
}

/** Человекочитаемое имя бренда: приводим ОРУЩИЙ КАПС к нормальному виду. */
export function prettifyBrand(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim();
  if (s !== s.toUpperCase()) return s; // уже есть строчные — автор знал, что пишет
  if (s.length <= 4) return s;         // TRW, NGK, ATE, VAG — аббревиатуры не трогаем
  return s
    .split(/(\s|\/|-)/)
    .map((part) =>
      /^[A-ZА-Я]{2,}$/.test(part) && part.length > 3
        ? part[0] + part.slice(1).toLowerCase()
        : part
    )
    .join("");
}

export function slugify(s: string): string {
  return foldLookalikes(s.toUpperCase())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "brand";
}

/** Цена из ячейки прайса в копейки. null, если цены нет или она нулевая. */
export function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    return raw > 0 ? Math.round(raw * 100) : null;
  }
  const s = String(raw).replace(/\s|\u00a0/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

export function parseQuantity(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
  const s = String(raw ?? "").replace(/\s|\u00a0/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export function formatPrice(kopecks: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " \u20bd";
}
