/**
 * Ручной справочник брендов. Это НЕ код — это бизнес-данные, которые ведёт
 * владелец площадки. Файл будет расти месяцами; когда он станет большим,
 * переедет в админку. Пока правится руками и требует переимпорта.
 *
 * ВНИМАНИЕ, требует проверки владельцем: группы вроде VAG и Hyundai / KIA
 * склеивают несколько марок в один бренд. Это верно для оригинальных номеров
 * (они общие внутри группы), но спорно в пограничных случаях.
 */

export type BrandGroup = {
  /** Как показывать покупателю */
  canonical: string;
  /** oem = оригинальный номер автопроизводителя, aftermarket = заменитель */
  kind: "oem" | "aftermarket";
  /** Написания, которые должны схлопнуться в этот бренд */
  aliases: string[];
};

export const BRAND_GROUPS: BrandGroup[] = [
  // --- группы автопроизводителей: номера общие внутри группы ---
  { canonical: "Hyundai / KIA", kind: "oem",
    aliases: ["Hyundai / KIA", "HYUNDAI/KIA", "KIA/HYUNDAI", "Hyundai /", "Hyundai-KIA", "Hyundai", "KIA"] },
  { canonical: "VAG", kind: "oem",
    aliases: ["VAG", "Volkswagen", "VW", "Audi", "Skoda", "Seat"] },
  { canonical: "Fiat / Alfa / Lancia", kind: "oem",
    aliases: ["Fiat / Alfa / Lancia", "Fiat/Alfa/Lancia", "Fiat", "Alfa Romeo", "Lancia"] },
  { canonical: "Peugeot / Citroen", kind: "oem",
    aliases: ["Peugeot / Citroen", "Peugeot-Citroen", "Citroen/Peugeot", "Peugeot/PSA", "PSA", "Peugeot", "Citroen"] },

  // --- один производитель, разные написания ---
  { canonical: "Mercedes-Benz", kind: "oem",
    aliases: ["Mercedes-Benz", "MERCEDES-BENZ", "Mercedes-benz", "Mercedes", "MB"] },
  { canonical: "Land Rover", kind: "oem", aliases: ["Land Rover", "LAND ROVER", "Range Rover"] },
  { canonical: "Porsche", kind: "oem", aliases: ["Porsche", "PORSCHE"] },
  { canonical: "Jaguar", kind: "oem", aliases: ["Jaguar", "JAGUAR"] },
  { canonical: "Ford", kind: "oem", aliases: ["Ford", "FORD"] },
  { canonical: "BMW", kind: "oem", aliases: ["BMW", "Mini"] },
  { canonical: "Toyota", kind: "oem", aliases: ["Toyota", "TOYOTA", "Lexus"] },
  { canonical: "Nissan", kind: "oem", aliases: ["Nissan", "NISSAN", "Infiniti"] },
  { canonical: "Mitsubishi", kind: "oem", aliases: ["Mitsubishi", "MITSUBISHI"] },
  { canonical: "Chrysler", kind: "oem", aliases: ["Chrysler", "CHRYSLER", "Dodge", "Jeep"] },
  { canonical: "General Motors", kind: "oem",
    aliases: ["General Motors", "GENERAL MOTORS", "GM", "Chevrolet", "Opel", "Daewoo"] },

  // --- группы производителей запчастей ---
  { canonical: "Mahle / Knecht", kind: "aftermarket",
    aliases: ["Mahle / Knecht", "Mahle/Knecht", "Mahle", "Knecht"] },
  { canonical: "NTN / SNR", kind: "aftermarket", aliases: ["NTN / SNR", "NTN/SNR", "NTN", "SNR"] },
];

/** Бренды, которые всегда считаем оригиналом, даже если их нет в группах выше. */
export const OEM_HINTS = [
  "Honda", "Mazda", "Subaru", "Suzuki", "Volvo", "Renault", "Lada", "ВАЗ", "ГАЗ", "УАЗ",
  "Great Wall", "Haval", "Chery", "Geely", "Ssangyong", "Isuzu", "Scania", "MAN", "Iveco",
];
