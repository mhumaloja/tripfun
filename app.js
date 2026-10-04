// TripFun – lasten selainsivu.
// Liittyy auton luomaan Supabase Realtime -kanavaan `tripfun:<istuntotunnus>`.
// Puhelin näkyy autolle Presencen kautta (vain pelaajan id). Lapsi valitsee pelimerkin eikä
// kirjoita nimeä, joten henkilötietoja ei käsitellä. Mitään ei tallenneta tietokantaan.
//
// Istuntotunnus (QR:n ?s=) on 26 merkkiä aakkostosta ABCDEFGHJKMNPQRSTUVWXYZ23456789
// (≈ 2^129), jotta vieras ei voi arvata kanavaa ja lähettää lapsille omia viestejään.
// Näytöillä näytetään vain 4 ensimmäistä merkkiä tunnistamista varten.
//
// Viestit (Broadcast):
//   auto -> puhelin: tokens   {catalog[{id, emoji, name}], taken{playerId: tokenId}}
//                    guide    {name, text, image?}   (Matkaopas; image = polku tällä sivustolla, esim. data/vaakunat/FI/297.png)
//                    question {id, text, options[], seconds}
//                    result   {qid, correct, correctPlayers[], scores[]}
//                    sync     {scores[], tokens, question?, lastResult?, guide?}   (myöhään liittyneelle / uudelleen yhdistäneelle)
//   puhelin -> auto: claim    {playerId, token}   (auto myöntää vapaan merkin; merkki pysyy koko pelin)
//                    answer   {qid, playerId, option}
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const $ = (id) => document.getElementById(id);
const VIEWS = ["join-view", "lobby-view", "guide-view", "question-view", "result-view", "no-code-view"];
const show = (id) => {
  for (const v of VIEWS) $(v).hidden = v !== id;
};

const code = (new URLSearchParams(location.search).get("s") || "").toUpperCase();

// crypto.randomUUID toimii vain https-sivuilla; kehityksessä sivu on http-osoitteessa.
const randomId = () =>
  crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

// Pysyvä tunniste tälle puhelimelle, jotta sivun päivitys ei luo uutta pelaajaa.
function playerId() {
  try {
    let id = localStorage.getItem("tripfun-id");
    if (!id) {
      id = randomId();
      localStorage.setItem("tripfun-id", id);
    }
    return id;
  } catch {
    return randomId();
  }
}


function setStatus(text, cls = "") {
  $("status").textContent = text;
  $("status").className = `status ${cls}`;
}

const LETTERS = ["A", "B", "C", "D"];
const myId = playerId();
let channel = null;
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
    pts.textContent = `${s.points} p`;
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
  channel.send({
    type: "broadcast",
    event: "answer",
    payload: { qid: currentQuestion.id, playerId: myId, option },
  });
  for (const b of $("options").children) b.disabled = true;
  button.classList.add("chosen");
  $("answered").hidden = false;
}

function showResult(r) {
  clearInterval(countdown);
  const q = currentQuestion;
  currentQuestion = null;
  const iWasRight = r.correctPlayers.includes(myId);
  $("result-title").textContent = iWasRight ? "🎉 Oikein! +1 piste" : "😅 Ei tällä kertaa";
  $("result-title").className = `result ${iWasRight ? "right" : "wrong"}`;
  $("result-answer").textContent = q && q.id === r.qid ? q.options[r.correct] : "–";
  renderScores(r.scores);
  show("result-view");
}

// Pelimerkit: auto on ainoa, joka päättää kenelle merkki kuuluu.
let myToken = null;
let claiming = null;

function handleTokens(tokens) {
  if (!tokens) return;
  const mine = tokens.catalog.find((t) => t.id === tokens.taken[myId]);
  if (mine) {
    const first = !myToken;
    myToken = mine;
    for (const el of document.querySelectorAll(".me-name")) el.textContent = `${mine.emoji} ${mine.name}`;
    if (first && !$("join-view").hidden) show("lobby-view");
    return;
  }
  renderTokenPicker(tokens);
}

function renderTokenPicker(tokens) {
  const takenIds = new Set(Object.values(tokens.taken));
  if (claiming && takenIds.has(claiming)) {
    $("token-status").textContent = "Ehti mennä toiselle – valitse toinen!";
  } else {
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
  $("token-status").textContent = "Varataan…";
  channel.send({ type: "broadcast", event: "claim", payload: { playerId: myId, token: tokenId } });
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
}

function join() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  channel = supabase.channel(`tripfun:${code}`, {
    config: { presence: { key: myId }, broadcast: { self: false } },
  });

  channel
    .on("broadcast", { event: "tokens" }, ({ payload }) => handleTokens(payload))
    .on("broadcast", { event: "guide" }, ({ payload }) => myToken && !currentQuestion && showGuide(payload))
    .on("broadcast", { event: "question" }, ({ payload }) => myToken && showQuestion(payload))
    .on("broadcast", { event: "result" }, ({ payload }) => myToken && showResult(payload))
    .on("broadcast", { event: "sync" }, ({ payload }) => {
      handleTokens(payload.tokens);
      if (!myToken) return; // ensin pelimerkki, sitten peliin
      renderScores(payload.scores);
      if (payload.guide && !payload.question) showGuide(payload.guide);
      if (payload.question) {
        // Ei näytetä samaa kysymystä uudelleen, jos siihen on jo vastattu.
        if (payload.question.id !== currentQuestion?.id) showQuestion(payload.question);
      } else if (currentQuestion) {
        // Kysymys päättyi sillä välin kun yhteys oli poikki (esim. näyttö lukossa).
        if (payload.lastResult?.qid === currentQuestion.id) showResult(payload.lastResult);
        else { clearInterval(countdown); currentQuestion = null; show("lobby-view"); }
      }
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({});
        setStatus("● Yhteys kunnossa", "ok");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setStatus("● Yhteys katkesi, yritetään uudelleen…", "err");
      }
    });

  show("join-view");
}

if (!/^[A-Z0-9]{26}$/.test(code)) {
  show("no-code-view");
} else {
  $("join-code").textContent = code.slice(0, 4);
  join();
}
