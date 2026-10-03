import { setDefaultLanguage } from "./default-language";
import en from "./json/en.json";
import ru from "./json/ru.json";

// Модуль импортируется дашбордом до инициализации i18next — язык успевает примениться с первого экрана
setDefaultLanguage("ru");

/** Переводы своих виджетов и страниц админки: ключи — в json/ru.json, в коде — `useTranslation()`. */
export default {
  ru: {
    translation: ru,
  },
  // Если админ выбрал английский в профиле — без этого он увидел бы ключи вместо текста
  en: {
    translation: en,
  },
};
