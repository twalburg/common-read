// src/lib/translations.js — Available Bible translations

export const TRANSLATIONS = [
  // English — popular first
  { code: 'NIV2011', label: 'NIV (2011)', language: 'English' },
  { code: 'NIV', label: 'NIV (1984)', language: 'English' },
  { code: 'ESV', label: 'ESV', language: 'English' },
  { code: 'BSB', label: 'BSB (Berean Standard)', language: 'English' },
  { code: 'NLT', label: 'NLT', language: 'English' },
  { code: 'NASB', label: 'NASB (1995)', language: 'English' },
  { code: 'KJV', label: 'KJV', language: 'English' },
  { code: 'NKJV', label: 'NKJV', language: 'English' },
  { code: 'CSB17', label: 'CSB', language: 'English' },
  { code: 'LSB', label: 'Legacy Standard', language: 'English' },
  { code: 'AMP', label: 'Amplified', language: 'English' },
  { code: 'MSG', label: 'The Message', language: 'English' },
  { code: 'NET', label: 'NET', language: 'English' },
  { code: 'MEV', label: 'MEV', language: 'English' },
  { code: 'CEB', label: 'Common English', language: 'English' },
  { code: 'WEB', label: 'World English Bible', language: 'English' },
  { code: 'RSV', label: 'RSV', language: 'English' },
  { code: 'TLV', label: 'Tree of Life', language: 'English' },
  { code: 'CJB', label: 'Complete Jewish Bible', language: 'English' },

  // Spanish
  { code: 'NVI', label: 'NVI', language: 'Español' },
  { code: 'NTV', label: 'NTV', language: 'Español' },
  { code: 'RV1960', label: 'Reina-Valera 1960', language: 'Español' },
  { code: 'LBLA', label: 'LBLA', language: 'Español' },
];

export function getTranslationLabel(code) {
  const t = TRANSLATIONS.find(t => t.code === code);
  return t ? t.label : code;
}

export function getSavedTranslation() {
  return localStorage.getItem('cr_translation') || 'BSB';
}

export function saveTranslation(code) {
  localStorage.setItem('cr_translation', code);
}
