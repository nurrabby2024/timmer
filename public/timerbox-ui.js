
(function () {
  const clockTimeEl = document.getElementById("clock-time");
  const clockDateEl = document.getElementById("clock-date");

  const swDisplayEl = document.getElementById("stopwatch-display");
  const swStatusEl = document.getElementById("stopwatch-status");
  const swLapsLabelEl = document.getElementById("stopwatch-laps-label");
  const swStartBtn = document.getElementById("stopwatch-start-btn");
  const swLapBtn = document.getElementById("stopwatch-lap-btn");
  const swResetBtn = document.getElementById("stopwatch-reset-btn");

  const cdDisplayEl = document.getElementById("countdown-display");
  const cdStatusEl = document.getElementById("countdown-status");
  const cdLabelEl = document.getElementById("countdown-label");
  const cdProgressEl = document.getElementById("countdown-progress");
  const cdPauseBtn = document.getElementById("countdown-pause-btn");
  const cdCancelBtn = document.getElementById("countdown-cancel-btn");

  const footerHintEl = document.getElementById("footer-hint");

  let clockInterval = null;

  // Stopwatch state
  let swRunning = false;
  let swStartTime = 0;
  let swElapsed = 0; // ms, accumulated
  let swInterval = null;
  let swLaps = [];

  // Countdown state
  let cdRunning = false;
  let cdPaused = false;
  let cdDuration = 0; // ms
  let cdEndTime = 0;
  let cdRemaining = 0;
  let cdInterval = null;

  function pad(num, size) {
    let s = String(num);
    while (s.length < size) s = "0" + s;
    return s;
  }

  // Clock
  function updateClock() {
    const now = new Date();
    const h = pad(now.getHours(), 2);
    const m = pad(now.getMinutes(), 2);
    const s = pad(now.getSeconds(), 2);
    if (clockTimeEl) {
      clockTimeEl.textContent = h + ":" + m + ":" + s;
    }
    if (clockDateEl) {
      const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
      clockDateEl.textContent = now.toLocaleDateString(undefined, options);
    }
  }

  // Stopwatch
  function renderStopwatch(ms) {
    const totalMs = Math.max(0, ms);
    const totalSeconds = totalMs / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((totalMs % 1000) / 100);
    if (swDisplayEl) {
      swDisplayEl.textContent = pad(minutes, 2) + ":" + pad(seconds, 2) + "." + tenths;
    }
  }

  function updateStopwatch() {
    if (!swRunning) return;
    const now = performance.now();
    const ms = swElapsed + (now - swStartTime);
    renderStopwatch(ms);
  }

  function startStopwatch() {
    if (swRunning) return;
    swRunning = true;
    swStartTime = performance.now();
    if (swStatusEl) swStatusEl.textContent = "Running";
    if (swStartBtn) swStartBtn.textContent = "Pause";
    if (!swInterval) {
      swInterval = setInterval(updateStopwatch, 100);
    }
  }

  function pauseStopwatch() {
    if (!swRunning) return;
    swRunning = false;
    const now = performance.now();
    swElapsed += (now - swStartTime);
    if (swStatusEl) swStatusEl.textContent = "Paused";
    if (swStartBtn) swStartBtn.textContent = "Resume";
  }

  function resetStopwatch() {
    swRunning = false;
    swElapsed = 0;
    swStartTime = 0;
    swLaps = [];
    renderStopwatch(0);
    if (swStatusEl) swStatusEl.textContent = "Idle";
    if (swStartBtn) swStartBtn.textContent = "Start";
    if (swLapsLabelEl) swLapsLabelEl.textContent = "No laps yet";
  }

  function addLap() {
    const now = performance.now();
    const currentMs = swRunning ? swElapsed + (now - swStartTime) : swElapsed;
    if (currentMs <= 0) return;
    swLaps.unshift(currentMs);
    if (swLaps.length > 3) swLaps = swLaps.slice(0, 3);
    if (swLapsLabelEl) {
      const parts = swLaps.map((ms, index) => {
        const totalSeconds = ms / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const tenths = Math.floor((ms % 1000) / 100);
        return "#" + (swLaps.length - index) + " " + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + tenths;
      });
      swLapsLabelEl.textContent = parts.join(" · ");
    }
  }

  // Countdown
  function renderCountdown(ms) {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (cdDisplayEl) {
      cdDisplayEl.textContent = pad(minutes, 2) + ":" + pad(seconds, 2);
    }
    if (cdDuration > 0 && cdProgressEl) {
      const progress = 1 - Math.max(0, ms) / cdDuration;
      cdProgressEl.style.width = (Math.min(1, Math.max(0, progress)) * 100).toFixed(1) + "%";
    }
  }

  function tickCountdown() {
    if (!cdRunning) return;
    const now = performance.now();
    const remaining = cdEndTime - now;
    cdRemaining = remaining;
    renderCountdown(remaining);
    if (remaining <= 0) {
      stopCountdown(true);
    }
  }

  function startCountdownMinutes(min) {
    const durationMs = min * 60 * 1000;
    cdDuration = durationMs;
    cdRemaining = durationMs;
    const now = performance.now();
    cdEndTime = now + durationMs;
    cdRunning = true;
    cdPaused = false;
    if (cdStatusEl) cdStatusEl.textContent = "Running";
    if (cdLabelEl) cdLabelEl.textContent = "Counting down from " + min + " min";
    renderCountdown(durationMs);
    if (cdInterval) clearInterval(cdInterval);
    cdInterval = setInterval(tickCountdown, 250);
  }

  function pauseCountdown() {
    if (!cdRunning) return;
    if (cdPaused) {
      // resume
      const now = performance.now();
      cdEndTime = now + cdRemaining;
      cdPaused = false;
      if (cdStatusEl) cdStatusEl.textContent = "Running";
      if (cdPauseBtn) cdPauseBtn.textContent = "Pause";
      return;
    }
    // pause now
    const now = performance.now();
    cdRemaining = cdEndTime - now;
    cdPaused = true;
    cdRunning = true;
    if (cdStatusEl) cdStatusEl.textContent = "Paused";
    if (cdPauseBtn) cdPauseBtn.textContent = "Resume";
  }

  function stopCountdown(finished) {
    cdRunning = false;
    cdPaused = false;
    if (cdInterval) {
      clearInterval(cdInterval);
      cdInterval = null;
    }
    if (cdStatusEl) cdStatusEl.textContent = "Idle";
    if (cdPauseBtn) cdPauseBtn.textContent = "Pause";
    if (cdLabelEl) {
      cdLabelEl.textContent = finished ? "Time's up. Nicely done." : "Tap a preset to start.";
    }
    cdDuration = 0;
    cdRemaining = 0;
    renderCountdown(0);
  }

  function attachEvents() {
    if (swStartBtn) {
      swStartBtn.addEventListener("click", () => {
        if (!swRunning && swElapsed === 0) {
          startStopwatch();
        } else if (swRunning) {
          pauseStopwatch();
        } else {
          startStopwatch();
        }
      });
    }
    if (swLapBtn) {
      swLapBtn.addEventListener("click", addLap);
    }
    if (swResetBtn) {
      swResetBtn.addEventListener("click", () => {
        resetStopwatch();
      });
    }

    if (cdPauseBtn) {
      cdPauseBtn.addEventListener("click", () => {
        if (!cdRunning && !cdPaused) return;
        pauseCountdown();
      });
    }
    if (cdCancelBtn) {
      cdCancelBtn.addEventListener("click", () => {
        if (cdRunning || cdPaused) {
          stopCountdown(false);
        }
      });
    }

    document.querySelectorAll(".chip-btn[data-min]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const min = Number(btn.getAttribute("data-min") || "0");
        if (!min) return;
        startCountdownMinutes(min);
      });
    });
  }

  function initFooterHint() {
    if (!footerHintEl) return;
    const hints = [
      "Tip: 25 min + 5 min break = a simple focus loop.",
      "Tip: Use laps to mark milestones in a task.",
      "Tip: Try a 10 min \"just start\" timer when stuck.",
      "Tip: Keep timers short so they feel easy to begin.",
      "Tip: Pair a countdown with airplane mode for deep work."
    ];
    const idx = Math.floor(Math.random() * hints.length);
    footerHintEl.textContent = hints[idx];
  }

  function init() {
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
    renderStopwatch(0);
    renderCountdown(0);
    attachEvents();
    initFooterHint();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
