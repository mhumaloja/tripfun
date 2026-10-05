// Viestien todennus (#24). QR:n skannannut voi kirjoittaa kanavalle, joten:
// - auton viestit on allekirjoitettu (ECDSA P-256); julkinen avain tulee QR:stä (k=), ja
//   allekirjoittamattomat tai väärennetyt viestit hylätään
// - puhelimen pelaajatunniste on sen julkisen avaimen tiiviste, ja viestit todennetaan HMAC:lla
//   ECDH-jaetusta avaimesta, joten kukaan ei voi vastata toisen nimissä
// - juokseva numero (n) estää vanhan viestin toistamisen: sama numero kelpaa kerran, ja
//   Realtime voi toimittaa lähes samanaikaiset viestit ristiin, joten hyväksytään ikkunan sisällä.
// Kuori: auto -> {d: JSON-merkkijono, s: allekirjoitus}, puhelin -> {p: pelaajan id, d, m: HMAC}.
// Todennettava tavujono on `${tapahtuma}\n${d}`. Auton puoli: data/SessionCrypto.kt.
// WebCrypto toimii vain suojatussa yhteydessä (https tai localhost).

const enc = new TextEncoder();
const EC = { name: "ECDH", namedCurve: "P-256" };
const CAR_WINDOW = 1000;

const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (text) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const sha256 = async (bytes) => new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
const concat = (a, b) => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
};

// Puhelimen avainpari säilyy sivun latausten yli, jotta pelaajatunniste (ja pelimerkki) pysyy.
async function myKeyPair() {
  try {
    const saved = JSON.parse(localStorage.getItem("tripfun-key"));
    if (saved) {
      const { d, ...pub } = saved;
      return {
        privateKey: await crypto.subtle.importKey("jwk", saved, EC, true, ["deriveBits"]),
        publicKey: await crypto.subtle.importKey("jwk", { ...pub, key_ops: [] }, EC, true, []),
      };
    }
  } catch {
    // vioittunut tai estetty tallennus: luodaan uusi
  }
  const pair = await crypto.subtle.generateKey(EC, true, ["deriveBits"]);
  try {
    localStorage.setItem("tripfun-key", JSON.stringify(await crypto.subtle.exportKey("jwk", pair.privateKey)));
  } catch {
    // yksityinen selausikkuna: tunniste vaihtuu latauksessa
  }
  return pair;
}

/** Avaa session auton julkisella avaimella; heittää, jos avain on virheellinen tai WebCrypto puuttuu. */
export async function openSession(carKey) {
  const carRaw = unb64(carKey);
  const carVerify = await crypto.subtle.importKey("raw", carRaw, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const carEcdh = await crypto.subtle.importKey("raw", carRaw, EC, false, []);
  const mine = await myKeyPair();
  const myRaw = new Uint8Array(await crypto.subtle.exportKey("raw", mine.publicKey));
  const playerId = b64((await sha256(myRaw)).slice(0, 16));
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: carEcdh }, mine.privateKey, 256));
  const macKey = await crypto.subtle.importKey(
    "raw", await sha256(concat(enc.encode("tripfun-v1"), shared)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const seenIn = new Set();
  let newestIn = 0;
  let lastOut = 0;

  return {
    playerId,
    /** Esittäytyminen: auto tarkistaa, että tunniste on avaimen tiiviste. */
    hello: () => ({ p: playerId, k: b64(myRaw) }),

    /** Auton viestin data, jos allekirjoitus on oikea eikä viesti ole toisto; muuten null. */
    async open(event, payload) {
      if (typeof payload?.d !== "string" || typeof payload?.s !== "string") return null;
      const ok = await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" }, carVerify, unb64(payload.s), enc.encode(`${event}\n${payload.d}`));
      if (!ok) return null;
      const data = JSON.parse(payload.d);
      // Auton numero on juokseva laskuri: ikkuna on viestimäärä.
      if (!Number.isInteger(data.n) || data.n <= newestIn - CAR_WINDOW || seenIn.has(data.n)) return null;
      seenIn.add(data.n);
      if (data.n > newestIn) {
        newestIn = data.n;
        for (const n of seenIn) if (n <= newestIn - CAR_WINDOW) seenIn.delete(n);
      }
      return data;
    },

    /** Puhelimen viesti kuoreen. Numero kasvaa myös sivun latausten yli (kellosta). */
    async seal(event, data) {
      lastOut = Math.max(Date.now(), lastOut + 1);
      const d = JSON.stringify({ ...data, playerId, n: lastOut });
      const m = new Uint8Array(await crypto.subtle.sign("HMAC", macKey, enc.encode(`${event}\n${d}`)));
      return { p: playerId, d, m: b64(m) };
    },
  };
}
