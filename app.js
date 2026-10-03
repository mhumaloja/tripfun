// TripFun – lasten selainsivu.
// Liittyy auton luomaan Supabase Realtime -kanavaan `tripfun:<koodi>`.
// Pelaaja näkyy autolle Presencen kautta; mitään ei tallenneta tietokantaan.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const $ = (id) => document.getElementById(id);
const show = (id) => {
  for (const v of ["join-view", "lobby-view", "no-code-view"]) $(v).hidden = v !== id;
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

function savedName() {
  try { return localStorage.getItem("tripfun-name") || ""; } catch { return ""; }
}

function setStatus(text, cls = "") {
  $("status").textContent = text;
  $("status").className = `status ${cls}`;
}

function renderPlayers(channel, myId) {
  const list = $("players");
  list.replaceChildren();
  const state = channel.presenceState();
  const players = Object.entries(state)
    .filter(([key]) => key !== "car")
    .map(([key, metas]) => ({ id: key, name: metas[0]?.name ?? "?" }))
    .sort((a, b) => a.name.localeCompare(b.name, "fi"));
  for (const p of players) {
    const li = document.createElement("li");
    li.textContent = `🎮 ${p.name}`;
    if (p.id === myId) li.classList.add("me");
    list.append(li);
  }
}

function join(name) {
  const id = playerId();
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const channel = supabase.channel(`tripfun:${code}`, {
    config: { presence: { key: id }, broadcast: { self: false } },
  });

  channel
    .on("presence", { event: "sync" }, () => renderPlayers(channel, id))
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ name });
        setStatus("● Yhteys kunnossa", "ok");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setStatus("● Yhteys katkesi, yritetään uudelleen…", "err");
      }
    });

  $("me").textContent = name;
  show("lobby-view");
}

if (!/^[A-Z0-9]{4}$/.test(code)) {
  show("no-code-view");
} else {
  $("join-code").textContent = code;
  $("name").value = savedName();
  show("join-view");
  $("join-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("name").value.trim().slice(0, 16);
    if (!name) return;
    try { localStorage.setItem("tripfun-name", name); } catch {}
    join(name);
  });
}
