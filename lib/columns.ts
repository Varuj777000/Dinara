/**
 * Распознавание колонок прайса. Сейчас — словарь синонимов; позже на этом же
 * месте встанет мастер сопоставления колонок в кабинете магазина
 * (и подсказка от LLM, которая предлагает разметку, а человек подтверждает).
 */

export type ColumnRole =
  | "article" | "brand" | "name" | "quantity"
  | "priceRetail" | "priceWholesale" | "location" | "delivery";

const SYNONYMS: Record<ColumnRole, string[]> = {
  article: ["артикул", "код", "номер", "каталожный номер", "парт номер", "article", "oem", "sku", "part number"],
  brand: ["бренд", "производитель", "изготовитель", "марка", "brand", "manufacturer", "make"],
  name: ["наименование", "название", "описание", "товар", "name", "description", "title"],
  quantity: ["количество", "кол-во", "колво", "остаток", "наличие", "qty", "quantity", "stock"],
  priceRetail: ["zzap", "цена", "розница", "розничная", "цена розничная", "price", "retail"],
  priceWholesale: ["опт", "оптовая", "цена опт", "оптовая цена", "wholesale"],
  location: ["место", "ячейка", "склад", "location", "shelf"],
  delivery: ["срок", "срок поставки", "доставка", "дней", "delivery", "lead time"],
};

/**
 * Колонки, которые ЗАПРЕЩЕНО импортировать ни при каких условиях.
 * Закупочная цена магазина не должна попадать в базу площадки вообще —
 * тогда её физически неоткуда утечь в выдачу, API или выгрузку.
 */
const FORBIDDEN = ["закуп", "закупка", "закупочная", "себестоимость", "приход", "cost", "purchase", "margin", "маржа", "наценка"];

const clean = (s: string) => s.toLowerCase().replace(/[\s._\-()]/g, "");

export function isForbiddenColumn(header: string): boolean {
  const h = clean(header);
  return FORBIDDEN.some((f) => h.includes(clean(f)));
}

export function detectRole(header: string): ColumnRole | null {
  const h = clean(header);
  if (!h || isForbiddenColumn(header)) return null;
  // сначала точное совпадение, потом вхождение — иначе "цена опт" уйдёт в розницу
  for (const [role, words] of Object.entries(SYNONYMS) as [ColumnRole, string[]][]) {
    if (words.some((w) => clean(w) === h)) return role;
  }
  for (const [role, words] of Object.entries(SYNONYMS) as [ColumnRole, string[]][]) {
    if (words.some((w) => h.includes(clean(w)))) return role;
  }
  return null;
}
