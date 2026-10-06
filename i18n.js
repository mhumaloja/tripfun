// Selainsivun tekstit kielittäin (#13). Kieli tulee autosta (tokens.lang), jotta sivu, kysymykset
// ja puhe ovat samaa kieltä; ennen sitä käytetään selaimen kieltä. Tukematon kieli → englanti.
// Norja on kirjanorjaa (nb), kuten auton sovelluksessa.

const TEXTS = {
  fi: {
    title: "TripFun",
    // Tietosuoja-, ehto- ja tukisivut (#57); ruotsiksi ja norjaksi englanninkieliset sivut
    privacy: "Tietosuoja",
    privacy_href: "tietosuoja.html",
    location_terms: "Sijaintiehdot",
    location_terms_href: "sijaintiehdot.html",
    support: "Tuki",
    support_href: "tuki.html",
    status_ok: "● Yhteys kunnossa",
    status_err: "● Yhteys katkesi, yritetään uudelleen…",
    choose_token: "Valitse pelimerkkisi!",
    loading_tokens: "Haetaan pelimerkkejä…",
    game: "Peli",
    token_taken: "Ehti mennä toiselle – valitse toinen!",
    claiming: "Varataan…",
    hello: "Hei",
    waiting: "Odotetaan seuraavaa kysymystä…",
    bingo_lead: "Bongaa ja napauta!",
    source: "Lähde",
    answered: "Vastaus lähetetty! Oikea vastaus paljastuu, kun aika loppuu…",
    correct_answer: "Oikea vastaus:",
    right: "🎉 Oikein! +1 piste",
    wrong: "😅 Ei tällä kertaa",
    scores: "Pisteet",
    points: "{n} p",
    seconds: "s",
    no_code: "Skannaa auton näytöllä oleva QR-koodi liittyäksesi peliin.",
    new_grid: "✨ Uudet ruudut!",
    my_line: "🎉 RIVI! +{n} p",
    my_full: "🎉 BINGO! +{n} p",
    other_line: "{who} sai rivin!",
    other_full: "{who} sai bingon!",
    someone: "Joku",
  },
  en: {
    title: "TripFun",
    // Tietosuoja-, ehto- ja tukisivut (#57); ruotsiksi ja norjaksi englanninkieliset sivut
    privacy: "Privacy",
    privacy_href: "privacy.html",
    location_terms: "Location terms",
    location_terms_href: "location-terms.html",
    support: "Support",
    support_href: "support.html",
    status_ok: "● Connected",
    status_err: "● Connection lost, retrying…",
    choose_token: "Pick your game piece!",
    loading_tokens: "Loading game pieces…",
    game: "Game",
    token_taken: "Someone was quicker – pick another one!",
    claiming: "Reserving…",
    hello: "Hi",
    waiting: "Waiting for the next question…",
    bingo_lead: "Spot it and tap!",
    source: "Source",
    answered: "Answer sent! The right answer is revealed when time runs out…",
    correct_answer: "Right answer:",
    right: "🎉 Correct! +1 point",
    wrong: "😅 Not this time",
    scores: "Scores",
    points: "{n} pts",
    seconds: "s",
    no_code: "Scan the QR code on the car screen to join the game.",
    new_grid: "✨ New squares!",
    my_line: "🎉 LINE! +{n} pts",
    my_full: "🎉 BINGO! +{n} pts",
    other_line: "{who} got a line!",
    other_full: "{who} got bingo!",
    someone: "Someone",
  },
  sv: {
    title: "TripFun",
    // Tietosuoja-, ehto- ja tukisivut (#57); ruotsiksi ja norjaksi englanninkieliset sivut
    privacy: "Integritet",
    privacy_href: "privacy.html",
    location_terms: "Platsvillkor",
    location_terms_href: "location-terms.html",
    support: "Support",
    support_href: "support.html",
    status_ok: "● Ansluten",
    status_err: "● Anslutningen bröts, försöker igen…",
    choose_token: "Välj din spelpjäs!",
    loading_tokens: "Hämtar spelpjäser…",
    game: "Spel",
    token_taken: "Någon hann före – välj en annan!",
    claiming: "Reserverar…",
    hello: "Hej",
    waiting: "Väntar på nästa fråga…",
    bingo_lead: "Spana och tryck!",
    source: "Källa",
    answered: "Svaret skickat! Rätt svar visas när tiden är ute…",
    correct_answer: "Rätt svar:",
    right: "🎉 Rätt! +1 poäng",
    wrong: "😅 Inte den här gången",
    scores: "Poäng",
    points: "{n} p",
    seconds: "s",
    no_code: "Skanna QR-koden på bilens skärm för att gå med i spelet.",
    new_grid: "✨ Nya rutor!",
    my_line: "🎉 RAD! +{n} p",
    my_full: "🎉 BINGO! +{n} p",
    other_line: "{who} fick en rad!",
    other_full: "{who} fick bingo!",
    someone: "Någon",
  },
  nb: {
    title: "TripFun",
    // Tietosuoja-, ehto- ja tukisivut (#57); ruotsiksi ja norjaksi englanninkieliset sivut
    privacy: "Personvern",
    privacy_href: "privacy.html",
    location_terms: "Posisjonsvilkår",
    location_terms_href: "location-terms.html",
    support: "Støtte",
    support_href: "support.html",
    status_ok: "● Tilkoblet",
    status_err: "● Forbindelsen ble brutt, prøver igjen…",
    choose_token: "Velg spillebrikken din!",
    loading_tokens: "Henter spillebrikker…",
    game: "Spill",
    token_taken: "Noen var raskere – velg en annen!",
    claiming: "Reserverer…",
    hello: "Hei",
    waiting: "Venter på neste spørsmål…",
    bingo_lead: "Se etter og trykk!",
    source: "Kilde",
    answered: "Svaret er sendt! Riktig svar vises når tiden er ute…",
    correct_answer: "Riktig svar:",
    right: "🎉 Riktig! +1 poeng",
    wrong: "😅 Ikke denne gangen",
    scores: "Poeng",
    points: "{n} p",
    seconds: "s",
    no_code: "Skann QR-koden på bilens skjerm for å bli med i spillet.",
    new_grid: "✨ Nye ruter!",
    my_line: "🎉 REKKE! +{n} p",
    my_full: "🎉 BINGO! +{n} p",
    other_line: "{who} fikk en rekke!",
    other_full: "{who} fikk bingo!",
    someone: "Noen",
  },
};

// Selaimen kielikoodi tuetuksi: norjan kaikki muodot kirjanorjaksi.
function supported(code) {
  const lang = String(code || "").toLowerCase().split("-")[0];
  if (lang === "no" || lang === "nn") return "nb";
  return lang in TEXTS ? lang : null;
}

let current = supported(navigator.language) ?? "en";

export const t = (key, vars = {}) =>
  (TEXTS[current][key] ?? TEXTS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");

/** Vaihtaa kielen ja päivittää sivun kiinteät tekstit (data-i18n). Tuntematon kieli ohitetaan. */
export function setLanguage(code) {
  const lang = supported(code);
  if (lang) current = lang;
  document.documentElement.lang = current;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-href]")) el.href = t(el.dataset.i18nHref);
}
