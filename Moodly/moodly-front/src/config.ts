// ⚙️ Réglages de l'app

// true  = l'app utilise des fausses données (pas besoin du back)
// false = l'app appelle le vrai back
export const USE_MOCK = true;

// Adresse du back quand USE_MOCK = false.
// ⚠️ Mets l'IP du PC qui fait tourner le back (pas "localhost"),
// et le téléphone doit être sur le même wifi.
export const API_URL = 'http://192.168.1.XX:3000';

// En dessous de ce nombre de réponses, une journée n'est pas affichée (anonymat)
export const MIN_ANSWERS = 3;
