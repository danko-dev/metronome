let audioContext = null;
let isPlaying = false;
let intervalID = null;
let nextNoteTime = 0;
let tempo = 120;
const lookahead = 25; // How often to check for scheduling (ms)
const scheduleAheadTime = 0.1; // How far ahead to schedule audio (s)

document.getElementById("startStop").addEventListener("click", () => {
  if (isPlaying) {
    stopMetronome();
  } else {
    startMetronome();
  }
});

document.getElementById("bpm").addEventListener("input", (e) => {
  tempo = parseInt(e.target.value);
});

function startMetronome() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  isPlaying = true;
  nextNoteTime = audioContext.currentTime;
  intervalID = setInterval(scheduleNotes, lookahead);
  document.getElementById("startStop").textContent = "Stop";
}

function stopMetronome() {
  isPlaying = false;
  clearInterval(intervalID);
  document.getElementById("startStop").textContent = "Start";
}

let subdivision = 1; // 1 = quarter notes, 2 = eighths, 3 = triplets, 4 = sixteenths

document.getElementById("subdivisions").addEventListener("input", (e) => {
  subdivision = parseInt(e.target.value);
});

function scheduleBeats() {
  if (!isPlaying) return;

  let timeNow = audioContext.currentTime;
  let elapsed = timeNow - startTime;

  // Smooth tempo adjustment
  if (rampDuration > 0) {
    let progress = Math.min(elapsed / rampDuration, 1);
    bpm = startBPM + progress * (targetBPM - startBPM);
  }

  let interval = 60 / bpm / subdivisions;

  playClick(
    timeNow,
    currentBeat % subdivisions === 0,
    currentBeat % subdivisions !== 0
  );

  currentBeat = (currentBeat + 1) % (4 * subdivisions);

  setTimeout(scheduleBeats, interval * 1000);
}

function scheduleNotes() {
  let timeNow = audioContext.currentTime;
  let elapsed = timeNow - startTime;

  // Smooth tempo adjustment
  if (rampDuration > 0) {
    let progress = Math.min(elapsed / rampDuration, 1);
    bpm = startBPM + progress * (targetBPM - startBPM);
  }

  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
    if (!isResting) {
      for (let i = 0; i < beatsPerBar * subdivision; i++) {
        let subTime = nextNoteTime + i * (60.0 / tempo / subdivision);

        let isFirstBeat = i % (beatsPerBar * subdivision) === 0;
        let isSubdivision = subdivision > 1 && i % subdivision !== 0; // Subdivision if not on main beat

        playClick(subTime, isFirstBeat, isSubdivision);
      }
    }

    nextNoteTime += (60.0 / tempo) * beatsPerBar; // Move to next full bar

    currentBar++;

    if (currentBar >= barsOn + barsRest) {
      currentBar = 0; // Reset bar count
    }

    isResting = currentBar >= barsOn; // Rest when barsOn is reached
  }
}

function playClick(time, isFirstBeat, isSubdivision) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const display = document.getElementById("metronomeDisplay");

  display.classList.remove("strong-beat", "normal-beat", "subdivision-beat");

  if (isFirstBeat) {
    osc.frequency.value = 1000;
    gain.gain.value = 0.6;
    display.classList.add("strong-beat");
  } else if (isSubdivision) {
    osc.frequency.value = 700;
    gain.gain.value = 0.2;
    display.classList.add("subdivision-beat");
  } else {
    osc.frequency.value = 850;
    gain.gain.value = 0.4;
    display.classList.add("normal-beat");
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      display.classList.remove(
        "strong-beat",
        "normal-beat",
        "subdivision-beat"
      );
    }, 100);
  });

  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(time);
  osc.stop(time + 0.05);
}

let barsOn = 3;
let barsRest = 1;
let currentBar = 0;
let isResting = false;
let beatsPerBar = 4;
let noteValue = 4; // Default to 4/4

document.getElementById("barsOn").addEventListener("input", (e) => {
  barsOn = parseInt(e.target.value);
  currentBar = 0; // Reset count
});

document.getElementById("barsRest").addEventListener("input", (e) => {
  barsRest = parseInt(e.target.value);
  currentBar = 0; // Reset count
});

document.getElementById("timeSignature").addEventListener("change", (e) => {
  const [beats, note] = e.target.value.split(",");
  beatsPerBar = parseInt(beats);
  noteValue = parseInt(note);
  currentBar = 0; // Reset bar count
});

// acceleration and slow down

let targetBPM = bpm;
let rampDuration = 0; // Seconds to change tempo
let startTime, startBPM;

function setTargetBPM(newBPM, duration) {
  targetBPM = newBPM;
  rampDuration = duration;
  startTime = audioContext.currentTime;
  startBPM = bpm;
}
