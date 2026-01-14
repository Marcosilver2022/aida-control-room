// AIDA Control Room — Page 1 (Start Mode + Sound Selection)
// GitHub Pages friendly: no build tools, no frameworks.

const session = {
  status: "New Session",
  mode: null,             // "songwriter" | "band" | "electronic"
  bpm: 120,
  bars: 16,
  backing: {
    drums: { preset: null, intensity: 0.7 },
    bass:  { source: "live", role: "groove", grit: 0.25 },
    glue: "tight"
  },
  take: 0,
  takes: []
};

// --- Drum preset lists (basics only) ---
const drumPresets = {
  band: [
    { id: "rock", label: "Rock" },
    { id: "jazz", label: "Jazz" },
    { id: "funk", label: "Funk" },
    { id: "dub",  label: "Dub" },
    { id: "punk", label: "Punk" },
    { id: "soul", label: "Soul/R&B" }
  ],
  electronic: [
    { id: "808", label: "808" },
    { id: "909", label: "909" },
    { id: "breakbeat", label: "Breakbeat" },
    { id: "garage", label: "Garage/2-step" },
    { id: "dnb", label: "DnB" },
    { id: "minimal", label: "Minimal" }
  ]
};

// --- DOM helpers ---
const $ = (id) => document.getElementById(id);

function show(pageId) {
  ["pageStart","pageSound","pageSongwriter","pageDebug"].forEach(pid => {
    $(pid).classList.toggle("hidden", pid !== pageId);
  });
}

function setStatus(text){
  session.status = text;
  $("sessionStatus").textContent = text;
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// --- Start screen wiring ---
function initStartScreen(){
  $("bpm").addEventListener("input", (e)=>{
    session.bpm = clamp(parseInt(e.target.value || "120", 10), 40, 220);
    e.target.value = session.bpm;
    refreshTakePreview();
  });

  $("bars").addEventListener("change", (e)=>{
    session.bars = parseInt(e.target.value, 10);
    refreshTakePreview();
  });

  document.querySelectorAll(".cardBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const mode = btn.getAttribute("data-mode");
      session.mode = mode;

      if (mode === "songwriter"){
        setStatus("Songwriter start");
        show("pageSongwriter");
        refreshDebug();
        return;
      }

      // band / electronic -> go to sound selection
      setStatus(mode === "band" ? "Band mode" : "Electronic mode");
      buildDrumPills(mode);
      // sensible defaults
      session.backing.drums.preset = drumPresets[mode][0].id;
      setActiveDrumPill(session.backing.drums.preset);
      show("pageSound");
      refreshTakePreview();
      refreshDebug();
    });
  });
}

// --- Sound selection wiring ---
function initSoundScreen(){
  $("backToStart").addEventListener("click", ()=>{
    setStatus("New Session");
    session.mode = null;
    show("pageStart");
    refreshDebug();
  });

  $("drumIntensity").addEventListener("input", (e)=>{
    const v = clamp(parseInt(e.target.value, 10), 0, 100);
    $("drumIntensityLabel").textContent = String(v);
    session.backing.drums.intensity = v / 100;
    refreshTakePreview();
    refreshDebug();
  });

  $("glue").addEventListener("change", (e)=>{
    session.backing.glue = e.target.value;
    refreshTakePreview();
    refreshDebug();
  });

  $("bassSource").addEventListener("change", (e)=>{
    session.backing.bass.source = e.target.value;
    refreshTakePreview();
    refreshDebug();
  });

  $("bassRole").addEventListener("change", (e)=>{
    session.backing.bass.role = e.target.value;
    refreshTakePreview();
    refreshDebug();
  });

  $("bassGrit").addEventListener("input", (e)=>{
    const v = clamp(parseInt(e.target.value, 10), 0, 100);
    $("bassGritLabel").textContent = String(v);
    session.backing.bass.grit = v / 100;
    refreshTakePreview();
    refreshDebug();
  });

  $("createTake").addEventListener("click", ()=>{
    // Create a stub "Take 01" object (later: render MIDI/audio)
    session.take += 1;

    const take = {
      id: session.take,
      createdAt: new Date().toISOString(),
      mode: session.mode,
      bpm: session.bpm,
      bars: session.bars,
      backing: structuredClone(session.backing),
      label: labelForTake()
    };

    session.takes.unshift(take);

    setStatus(`Take ${take.id} created`);
    $("takePreview").textContent = `Created: ${take.label}`;

    // Optional: reveal debug panel so you can see state
    $("pageDebug").classList.remove("hidden");
    refreshDebug();
  });
}

function labelForTake(){
  const drumName = findPresetLabel(session.mode, session.backing.drums.preset);
  const bassName = session.backing.bass.source === "live" ? "Live bass" : "Synth bass";
  const role = session.backing.bass.role;
  return `Take ${session.take} — ${drumName} drums + ${bassName} (${role}), ${session.bpm} BPM, ${session.bars} bars`;
}

function findPresetLabel(mode, presetId){
  const p = drumPresets[mode]?.find(x => x.id === presetId);
  return p ? p.label : presetId;
}

function refreshTakePreview(){
  if (!session.mode) return;

  const modeTitle = session.mode === "band" ? "Band" : "Electronic";
  $("soundSubtitle").textContent = `Basics for Take 01 (${modeTitle}: drums + bass).`;

  const drumName = findPresetLabel(session.mode, session.backing.drums.preset || "");
  const bassName = session.backing.bass.source === "live" ? "Live bass" : "Synth bass";
  const role = session.backing.bass.role;
  const glue = session.backing.glue;

  $("takePreview").textContent =
    `Take 01 preview: ${drumName} drums • ${bassName} (${role}) • feel: ${glue} • ${session.bpm} BPM • ${session.bars} bars`;
}

function buildDrumPills(mode){
  const holder = $("drumPills");
  holder.innerHTML = "";

  drumPresets[mode].forEach(p=>{
    const b = document.createElement("button");
    b.className = "pillBtn";
    b.type = "button";
    b.textContent = p.label;
    b.dataset.preset = p.id;

    b.addEventListener("click", ()=>{
      session.backing.drums.preset = p.id;
      setActiveDrumPill(p.id);
      refreshTakePreview();
      refreshDebug();
    });

    holder.appendChild(b);
  });

  // Reset UI controls for new mode
  $("drumIntensity").value = "70";
  $("drumIntensityLabel").textContent = "70";
  $("glue").value = "tight";
  $("bassSource").value = "live";
  $("bassRole").value = "groove";
  $("bassGrit").value = "25";
  $("bassGritLabel").textContent = "25";

  session.backing.drums.intensity = 0.7;
  session.backing.glue = "tight";
  session.backing.bass.source = "live";
  session.backing.bass.role = "groove";
  session.backing.bass.grit = 0.25;
}

function setActiveDrumPill(presetId){
  document.querySelectorAll("#drumPills .pillBtn").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.preset === presetId);
  });
}

// --- Songwriter stub wiring ---
function initSongwriter(){
  $("backToStart2").addEventListener("click", ()=>{
    setStatus("New Session");
    session.mode = null;
    show("pageStart");
    refreshDebug();
  });

  $("saveLyrics").addEventListener("click", ()=>{
    const lyrics = $("lyrics").value.trim();
    if (!lyrics){
      setStatus("Paste some lyrics first");
      return;
    }
    session.mode = "songwriter";
    session.lyrics = lyrics;
    setStatus("Lyrics saved");
    $("pageDebug").classList.remove("hidden");
    refreshDebug();
  });
}

// --- Debug ---
function refreshDebug(){
  $("debug").textContent = JSON.stringify(session, null, 2);
}

// --- Init ---
initStartScreen();
initSoundScreen();
initSongwriter();
refreshDebug();
