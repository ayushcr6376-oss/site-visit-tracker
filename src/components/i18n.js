import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_title": "Industrial Site Tracker",
      "total_billing": "Total Billing",
      "hours_logged": "Hours Logged",
      "save_visit": "Save Visit",
      "client_name": "Client Name",
      "check_in": "Check In",
      "check_out": "Check Out",
      "status": "Status",
      "pending": "Pending",
      "completed": "Completed"
    }
  },
  hi: {
    translation: {
      "app_title": "साइट विजिट ट्रैकर",
      "total_billing": "कुल बिलिंग",
      "hours_logged": "कुल घंटे दर्ज",
      "save_visit": "विजिट सेव करें",
      "client_name": "क्लाइंट का नाम",
      "check_in": "चेक इन",
      "check_out": "चेक आउट",
      "status": "स्थिति",
      "pending": "लंबित (Pending)",
      "completed": "पूरा हुआ (Completed)"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;