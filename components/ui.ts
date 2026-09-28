/** Мелкие помощники оформления, общие для всех страниц. */

/** Русское склонение: plural(5, ["предложение", "предложения", "предложений"]) → "предложений". */
export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/** Стабильный оттенок (0–360) из строки — для цветных плашек брендов и магазинов. */
export function hueOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

/** Первая буква/цифра для аватарки. */
export function initialOf(text: string): string {
  const m = text.match(/[\p{L}\p{N}]/u);
  return m ? m[0].toUpperCase() : "•";
}

export function numberRu(n: number): string {
  return n.toLocaleString("ru-RU");
}
