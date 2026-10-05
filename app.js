// TripFun – lasten selainsivu.
// Liittyy auton luomaan Supabase Realtime -kanavaan `tripfun:<istuntotunnus>`.
// Puhelin näkyy autolle Presencen kautta (vain pelaajan id). Lapsi valitsee pelimerkin eikä
// kirjoita nimeä, joten henkilötietoja ei käsitellä. Mitään ei tallenneta tietokantaan.
//
// Istuntotunnus (QR:n ?s=) on 26 merkkiä aakkostosta ABCDEFGHJKMNPQRSTUVWXYZ23456789
// (≈ 2^129), jotta vieras ei voi arvata kanavaa ja lähettää lapsille omia viestejään.
// Näytöillä näytetään vain 4 ensimmäistä merkkiä tunnistamista varten.
// QR:n k= on auton julkinen avain: viestit kulkevat todennetussa kuoressa (session.js, #24),
// ja alla oleva sisältö on kuoren d-kentän JSON (aina mukana juokseva n; puhelimen viesteissä
// myös lähettäjän playerId, joka on puhelimen avaimen tiiviste).
//
// Viestit (Broadcast):
//   auto -> puhelin: tokens   {catalog[{id, emoji, name}], taken{playerId: tokenId}, lang?}   (lang = auton kieli: fi, en, sv, nb)
//                    guide    {name, text, image?}   (Matkaopas; image = polku tällä sivustolla, esim. data/vaakunat/FI/297.png)
//                    question {id, text, options[], seconds}
//                    result   {qid, correct, correctPlayers[], scores[]}
//                    bingo    {active, round?, items[{emoji, name}]?, grids{playerId: [16 kohdeindeksiä]}?,
//                              marks{playerId: [ruutu]}?, lines{playerId: [riviindeksi]}?}
//                             (Bongausbingo; kaikkien ruudukot, puhelin poimii omansa. Ruudut 0–15 riveittäin,
//                              rivit 0–3 vaaka, 4–7 pysty, 8 ja 9 vinot. active=false: bingo sammutettiin)
//                    bingoResult {playerId, kind: "line"|"full", points, scores[]}
//                    sync     {scores[], tokens, question?, lastResult?, guide?, bingo?}   (myöhään liittyneelle / uudelleen yhdistäneelle)
//   puhelin -> auto: claim    {playerId, token}   (auto myöntää vapaan merkin; merkki pysyy koko pelin)
//                    answer   {qid, playerId, option}
//                    hello    {p, k}   (kuoreton: pelaajan id ja julkinen avain; kanavalle liittyessä, auto vastaa syncillä)
//                    mark     {playerId, cell, marked}   (oman ruudukon ruutu 0–15; auto pisteyttää rivit)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { t, setLanguage } from "./i18n.js";
import { openSession } from "./session.js";

const $ = (id) => document.getElementById(id);
const VIEWS = ["join-view", "lobby-view", "bingo-view", "guide-view", "question-view", "result-view", "no-code-view"];
const show = (id) => {
  for (const v of VIEWS) $(v).hidden = v !== id;
};

const params = new URLSearchParams(location.search);
const code = (params.get("s") || "").toUpperCase();
const carKey = params.get("k") || "";


// Pysyvät tilatekstit data-i18n-avaimella, jotta ne vaihtuvat kielen mukana.
function setText(el, key) {
  el.dataset.i18n = key;
  el.textContent = t(key);
}

function setStatus(key, cls = "") {
  setText($("status"), key);
  $("status").className = `status ${cls}`;
}

const LETTERS = ["A", "B", "C", "D"];
let session = null;
let myId = null; // puhelimen avaimesta (session.js)
let channel = null;

// Viestit autolle todennettuina ja lähetysjärjestyksessä: auto hylkää numeroltaan vanhemman
// viestin toistona, joten nopeat peräkkäiset merkinnät eivät saa ohittaa toisiaan.
let outbox = Promise.resolve();
function send(event, data) {
  outbox = outbox.then(async () => {
    channel.send({ type: "broadcast", event, payload: await session.seal(event, data) });
  });
}
let currentQuestion = null;
let countdown = null;

function renderScores(scores) {
  const list = $("scores");
  list.replaceChildren();
  scores.forEach((s, i) => {
    const li = document.createElement("li");
    const medal = s.points > 0 ? ["🥇", "🥈", "🥉"][i] ?? "🎮" : "🎮";
    li.textContent = `${medal} ${s.name}`;
    const pts = document.createElement("span");
    pts.className = "points";
    pts.textContent = t("points", { n: s.points });
    li.append(pts);
    if (s.id === myId) li.classList.add("me");
    list.append(li);
  });
  $("scores-view").hidden = false;
}

function showQuestion(q) {
  currentQuestion = q;
  $("question-text").textContent = q.text;
  $("answered").hidden = true;

  const options = $("options");
  options.replaceChildren();
  q.options.forEach((text, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `option option-${i}`;
    b.innerHTML = `<span class="letter">${LETTERS[i]}</span>`;
    b.append(text);
    b.addEventListener("click", () => answer(i, b));
    options.append(b);
  });

  let left = q.seconds;
  $("seconds").textContent = left;
  clearInterval(countdown);
  countdown = setInterval(() => {
    left = Math.max(0, left - 1);
    $("seconds").textContent = left;
    if (left === 0) {
      clearInterval(countdown);
      for (const b of $("options").children) b.disabled = true;
    }
  }, 1000);

  show("question-view");
  navigator.vibrate?.(200);
}

function answer(option, button) {
  if (!currentQuestion) return;
  send("answer", { qid: currentQuestion.id, option });
  for (const b of $("options").children) b.disabled = true;
  button.classList.add("chosen");
  $("answered").hidden = false;
}

function showResult(r) {
  clearInterval(countdown);
  const q = currentQuestion;
  currentQuestion = null;
  const iWasRight = r.correctPlayers.includes(myId);
  $("result-title").textContent = t(iWasRight ? "right" : "wrong");
  $("result-title").className = `result ${iWasRight ? "right" : "wrong"}`;
  $("result-answer").textContent = q && q.id === r.qid ? q.options[r.correct] : "–";
  renderScores(r.scores);
  show("result-view");
  returnToIdle(RESULT_PAUSE_MS);
}

// Pelimerkit: auto on ainoa, joka päättää kenelle merkki kuuluu.
let myToken = null;
let claiming = null;

function handleTokens(tokens) {
  if (!tokens) return;
  setLanguage(tokens.lang);
  const mine = tokens.catalog.find((t) => t.id === tokens.taken[myId]);
  if (mine) {
    const first = !myToken;
    myToken = mine;
    for (const el of document.querySelectorAll(".me-name")) el.textContent = `${mine.emoji} ${mine.name}`;
    if (first && !$("join-view").hidden) showIdle();
    return;
  }
  renderTokenPicker(tokens);
}

function renderTokenPicker(tokens) {
  const takenIds = new Set(Object.values(tokens.taken));
  if (claiming && takenIds.has(claiming)) {
    setText($("token-status"), "token_taken");
  } else {
    delete $("token-status").dataset.i18n;
    $("token-status").textContent = "";
  }
  claiming = null;
  const grid = $("tokens");
  grid.replaceChildren();
  for (const t of tokens.catalog) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "token";
    b.disabled = takenIds.has(t.id);
    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = t.emoji;
    b.append(emoji, t.name);
    b.addEventListener("click", () => claim(t.id, b));
    grid.append(b);
  }
}

function claim(tokenId, button) {
  claiming = tokenId;
  for (const b of $("tokens").children) b.disabled = true;
  button.classList.add("waiting");
  setText($("token-status"), "claiming");
  send("claim", { token: tokenId });
}

function showGuide(g) {
  $("guide-name").textContent = g.name;
  $("guide-text").textContent = g.text;
  // Vain tämän sivuston vaakunat: kanavalle voi lähettää kuka tahansa QR:n skannannut (#24),
  // eikä puhelin saa hakea kuvaa vieraalta palvelimelta (IP-osoite vuotaisi).
  const safe = typeof g.image === "string" && /^data\/vaakunat\/[A-Z]{2}\/\d{3,4}\.png$/.test(g.image);
  const img = $("guide-image");
  img.hidden = !safe;
  if (safe) img.src = g.image;
  show("guide-view");
  returnToIdle(readingTimeMs(`${g.name}. ${g.text}`));
}

// Samat ajat kuin autossa (QuizMode.RESULT_PAUSE_MS, GuideMode.readingTimeMs): esitys peittää
// ruudukon vain sen ajan, kun auto esittää sitä.
const RESULT_PAUSE_MS = 5000;
const readingTimeMs = (text) => Math.min(25000, Math.max(8000, (text.length * 1000) / 15));

let idleTimer = null;
function returnToIdle(ms) {
  clearTimeout(idleTimer);
  // Ilman bingoa esitys jää näkyviin seuraavaan asti, kuten ennenkin.
  idleTimer = setTimeout(() => {
    if (bingo && !currentQuestion) showIdle();
  }, ms);
}

// Perusnäkymä esitysten välillä: bingoruudukko, jos bingo on päällä, muuten aula.
function showIdle() {
  clearTimeout(idleTimer);
  show(bingo ? "bingo-view" : "lobby-view");
}

// Bongausbingo: auto pitää tilan ja pisteyttää, puhelin näyttää oman ruudukon ja lähettää merkinnät.
const BINGO_CELLS = 16;
const BINGO_LINES = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  [0, 5, 10, 15], [3, 6, 9, 12],
];
let bingo = null; // {round, items, grid, marks:Set, lines:Set}

function handleBingo(b) {
  if (!b) return;
  const grid = b.active && b.grids?.[myId];
  const valid = Array.isArray(b.items) && b.items.length === BINGO_CELLS &&
    Array.isArray(grid) && grid.length === BINGO_CELLS && grid.every((i) => Number.isInteger(i) && b.items[i]);
  const wasShowing = !$("bingo-view").hidden;
  if (!valid) {
    bingo = null;
    if (wasShowing) showIdle();
    return;
  }
  const newRound = bingo && bingo.round !== b.round;
  bingo = {
    round: b.round,
    items: b.items,
    grid,
    marks: new Set(b.marks?.[myId] ?? []),
    lines: new Set(b.lines?.[myId] ?? []),
  };
  renderBingo();
  if (newRound) flashBingo(t("new_grid"));
  if (!$("lobby-view").hidden) showIdle();
}

function renderBingo() {
  const inLine = new Set([...bingo.lines].flatMap((l) => BINGO_LINES[l] ?? []));
  const board = $("bingo-grid");
  board.replaceChildren();
  bingo.grid.forEach((itemIndex, cell) => {
    const item = bingo.items[itemIndex];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cell";
    b.classList.toggle("marked", bingo.marks.has(cell));
    b.classList.toggle("line", inLine.has(cell));
    b.setAttribute("aria-pressed", bingo.marks.has(cell));
    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = item.emoji;
    b.append(emoji, item.name);
    b.addEventListener("click", () => mark(cell));
    board.append(b);
  });
}

function mark(cell) {
  if (!bingo || currentQuestion) return;
  const marked = !bingo.marks.has(cell);
  // Näytetään heti; auton seuraava bingo-viesti on silti totuus.
  if (marked) bingo.marks.add(cell);
  else bingo.marks.delete(cell);
  renderBingo();
  send("mark", { cell, marked });
}

let flashTimer = null;
function flashBingo(text) {
  const el = $("bingo-flash");
  el.textContent = text;
  el.hidden = false;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { el.hidden = true; }, 4000);
}

function showBingoResult(r) {
  renderScores(r.scores);
  const full = r.kind === "full";
  if (r.playerId === myId) {
    flashBingo(t(full ? "my_full" : "my_line", { n: r.points }));
    navigator.vibrate?.([100, 50, 100]);
  } else {
    const who = r.scores.find((s) => s.id === r.playerId)?.name ?? t("someone");
    flashBingo(t(full ? "other_full" : "other_line", { who }));
  }
}

function join() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  channel = supabase.channel(`tripfun:${code}`, {
    config: { presence: { key: myId }, broadcast: { self: false } },
  });

  // Auton viestit tarkistetaan ennen käsittelyä; jono pitää ne saapumisjärjestyksessä,
  // vaikka tarkistus on asynkroninen. Väärennetyt ja toistetut viestit ohitetaan hiljaa.
  let inbox = Promise.resolve();
  const on = (event, handler) =>
    channel.on("broadcast", { event }, ({ payload }) => {
      inbox = inbox.then(async () => {
        const data = await session.open(event, payload).catch(() => null);
        if (data) handler(data);
      });
    });

  on("tokens", (payload) => handleTokens(payload));
  on("guide", (payload) => myToken && !currentQuestion && showGuide(payload));
  on("question", (payload) => myToken && showQuestion(payload));
  on("result", (payload) => myToken && showResult(payload));
  on("bingo", (payload) => myToken && handleBingo(payload));
  on("bingoResult", (payload) => myToken && showBingoResult(payload));
  on("sync", (payload) => {
    handleTokens(payload.tokens);
    if (!myToken) return; // ensin pelimerkki, sitten peliin
    renderScores(payload.scores);
    handleBingo(payload.bingo ?? { active: false });
    if (payload.guide && !payload.question) showGuide(payload.guide);
    if (payload.question) {
      // Ei näytetä samaa kysymystä uudelleen, jos siihen on jo vastattu.
      if (payload.question.id !== currentQuestion?.id) showQuestion(payload.question);
    } else if (currentQuestion) {
      // Kysymys päättyi sillä välin kun yhteys oli poikki (esim. näyttö lukossa).
      if (payload.lastResult?.qid === currentQuestion.id) showResult(payload.lastResult);
      else { clearInterval(countdown); currentQuestion = null; showIdle(); }
    }
  });
  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({});
      // Uudelleenlatauksessa Presence ei näytä autolle paluuta (vanha yhteys poistuu vasta myöhemmin).
      channel.send({ type: "broadcast", event: "hello", payload: session.hello() });
      setStatus("status_ok", "ok");
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      setStatus("status_err", "err");
    }
  });

  show("join-view");
}

setLanguage(); // selaimen kieli, kunnes auto kertoo omansa
// Ilman auton avainta (vanha QR) tai suojattua yhteyttä (WebCrypto) peliin ei liitytä.
session = /^[A-Z0-9]{26}$/.test(code) ? await openSession(carKey).catch(() => null) : null;
if (!session) {
  show("no-code-view");
} else {
  myId = session.playerId;
  $("join-code").textContent = code.slice(0, 4);
  join();
}
