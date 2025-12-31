import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app.title": "Shatter Rush ASMR",
      "loading": "Loading...",
      "start": "Tap to Start",
      "score": "Score",
      "distance": "Distance"
    }
  },
  ja: {
    translation: {
      "app.title": "Shatter Rush ASMR",
      "loading": "読み込み中...",
      "start": "タップしてスタート",
      "score": "スコア",
      "distance": "距離"
    }
  }
};

export const initI18n = (language: string) => {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      }
    });
};

export default i18n;
