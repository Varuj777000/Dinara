/**
 * ЗАГЛУШКА. Владелец попросил временные контакты, чтобы увидеть сайт целиком —
 * реальные WhatsApp/Telegram/адрес появятся позже. Перед показом сайта живым
 * покупателям обязательно заменить значения ниже на настоящие.
 */
export const PLATFORM_CONTACTS = {
  phoneDisplay: "+7 900 000-00-00",
  phoneHref: "tel:+79000000000",
  whatsappHref: "https://wa.me/79000000000",
  telegramHref: "https://t.me/autozapchasti_market",
  telegramDisplay: "@autozapchasti_market",
  city: "Москва",
};

/** Готовит номер телефона магазина для tel:-ссылки. */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
