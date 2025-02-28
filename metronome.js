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

// ******

let subdivision = 1; // 1 = quarter notes, 2 = eighths, 3 = triplets, 4 = sixteenths

document.getElementById("subdivisions").addEventListener("input", (e) => {
  subdivision = parseInt(e.target.value);
});

function scheduleNotes() {
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
    if (!isResting) {
      for (let i = 0; i < beatsPerBar * subdivision; i++) {
        let subTime = nextNoteTime + i * (60.0 / tempo / subdivision);
        playClick(subTime, i % beatsPerBar === 0); // Accent first beat
      }
    }

    nextNoteTime += (60.0 / tempo) * beatsPerBar; // Move to next full bar

    // Count bars for resting logic
    currentBar++;

    if (currentBar >= barsOn + barsRest) {
      currentBar = 0; // Reset bar count
    }

    isResting = currentBar >= barsOn; // Rest when barsOn is reached
  }
}

// function scheduleNotes() {
//   while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
//     if (!isResting) {
//       for (let i = 0; i < subdivision; i++) {
//         let subTime = nextNoteTime + i * (60.0 / tempo / subdivision);
//         playClick(subTime, i === 0); // First note in subdivision is accented
//       }
//     }

//     nextNoteTime += 60.0 / tempo; // Move to next beat

//     // Count beats to determine when to enter/exit rest mode
//     if (
//       nextNoteTime >=
//       audioContext.currentTime + (barsOn + barsRest) * (60 / tempo) * 4
//     ) {
//       currentBar = 0; // Reset bar count
//     } else if ((currentBar + 1) % (barsOn + barsRest) === 0) {
//       isResting = true; // Enter rest mode
//     } else if (currentBar % (barsOn + barsRest) === 0) {
//       isResting = false; // Exit rest mode
//     }

//     currentBar++;
//   }
// }

// function scheduleNotes() {
//   while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
//     for (let i = 0; i < subdivision; i++) {
//       let subTime = nextNoteTime + i * (60.0 / tempo / subdivision);
//       playClick(subTime, i === 0); // First note in subdivision is accented
//     }
//     nextNoteTime += 60.0 / tempo; // Move to next beat
//   }
// }

// function scheduleNotes() {
//   while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
//     playClick(nextNoteTime);
//     nextNoteTime += 60.0 / tempo;
//   }
// }

// ******

function playClick(time, isAccented) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  if (isAccented) {
    osc.frequency.value = 1000; // Strong beat
    gain.gain.value = 0.6;
  } else {
    osc.frequency.value = 800; // Softer subdivision click
    gain.gain.value = 0.3;
  }

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(time);
  osc.stop(time + 0.05);
}

let barsOn = 4;
let barsRest = 1;
let currentBar = 0;
let isResting = false;
let beatsPerBar = 4;
let noteValue = 4; // Default to 4/4

// let barsOn = 4; // Default: 4 bars of sound
// let barsRest = 1; // Default: 1 bar of silence
// let currentBar = 0;
// let isResting = false;

document.getElementById("barsOn").addEventListener("input", (e) => {
  barsOn = parseInt(e.target.value);
  currentBar = 0; // Reset count
});

document.getElementById("barsRest").addEventListener("input", (e) => {
  barsRest = parseInt(e.target.value);
  currentBar = 0; // Reset count
});

// function playClick(time) {
//   const osc = audioContext.createOscillator();
//   const gain = audioContext.createGain();

//   osc.frequency.value = 1000; // Click sound
//   gain.gain.value = 0.5;

//   osc.connect(gain);
//   gain.connect(audioContext.destination);

//   osc.start(time);
//   osc.stop(time + 0.05);
// }

document.getElementById("timeSignature").addEventListener("change", (e) => {
  const [beats, note] = e.target.value.split(",");
  beatsPerBar = parseInt(beats);
  noteValue = parseInt(note);
  currentBar = 0; // Reset bar count
});
