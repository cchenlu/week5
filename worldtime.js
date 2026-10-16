// ===== World Time App =====
// Uses UAPI World Time: https://uapis.cn/api/v1/misc/worldtime?city=<name>
// The API response is the initial time reference; the clock then ticks locally every second.
(function () {
  var form = document.getElementById("timeForm");
  var cityInput = document.getElementById("cityInput");
  var searchBtn = document.getElementById("searchBtn");
  var statusEl = document.getElementById("timeStatus");
  var card = document.getElementById("timeCard");
  var cityEl = document.getElementById("timeCity");
  var clockEl = document.getElementById("timeClock");
  var dateEl = document.getElementById("timeDate");
  var zoneEl = document.getElementById("timeZone");

  if (!form) return;

  var API_URL = "https://uapis.cn/api/v1/misc/worldtime";
  var tickInterval = null;

  // Reference point from the API response:
  //   initialUnix (seconds) + localStartMs (ms) anchor the live clock.
  var initialUnix = null;
  var localStartMs = null;
  var timezone = null;

  function setStatus(text, kind) {
    statusEl.textContent = text || "";
    statusEl.className = "time-status" + (kind ? " " + kind : "");
  }

  function hideCard() {
    card.hidden = true;
  }

  function stopTicking() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  // Format a Date (already adjusted to the city's local time) as HH:MM:SS.
  function formatTime(d) {
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  // Format a Date as "Friday, October 16, 2026".
  function formatDate(d) {
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return weekdays[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  // Compute current city-local time from the API reference and render it.
  function tick() {
    if (initialUnix === null || localStartMs === null) return;
    var elapsedSec = Math.floor((Date.now() - localStartMs) / 1000);
    var currentUnixMs = (initialUnix + elapsedSec) * 1000;
    var d = new Date(currentUnixMs);

    // The API returns datetime already offset to the city's local time,
    // so we treat its timestamp_unix as already representing wall-clock ms
    // for that city. We just render the Date parts directly.
    clockEl.textContent = formatTime(d);
    dateEl.textContent = formatDate(d);
  }

  function showCard(data) {
    var city = data.query || "";
    var tz = data.timezone || "";
    var offsetStr = data.offset_string || "";

    initialUnix = data.timestamp_unix;
    localStartMs = Date.now();
    timezone = tz;

    cityEl.textContent = city ? city : "Unknown city";
    zoneEl.textContent = tz ? (tz + (offsetStr ? "  ·  UTC" + offsetStr.replace(/^UTC/, "") : "")) : "";

    card.hidden = false;
    tick(); // render immediately
    stopTicking();
    tickInterval = setInterval(tick, 1000);
  }

  function setLoading() {
    setStatus("Loading...", "loading");
    hideCard();
  }

  function setError(message) {
    setStatus(message, "error");
    hideCard();
    stopTicking();
  }

  async function fetchTime(city) {
    var url = API_URL + "?city=" + encodeURIComponent(city);
    var response = await fetch(url);
    var data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error("parse");
    }

    if (data && data.error === "TIMEZONE_NOT_FOUND") {
      return { notFound: true };
    }
    if (data && data.error && data.error !== "TIMEZONE_NOT_FOUND") {
      throw new Error(data.error);
    }

    // Must have a timestamp to be considered valid
    if (!data || data.timestamp_unix === undefined || data.timestamp_unix === null) {
      return { notFound: true };
    }
    return { data: data };
  }

  async function handleSearch() {
    var city = cityInput.value.trim();

    // Empty input — do NOT call the API
    if (!city) {
      setError("Enter a city first.");
      cityInput.focus();
      return;
    }

    searchBtn.disabled = true;
    stopTicking();
    setLoading();

    try {
      var result = await fetchTime(city);
      if (result.notFound) {
        setError("Couldn't find that city — check the spelling.");
      } else {
        setStatus("");
        showCard(result.data);
      }
    } catch (err) {
      setError("Couldn't fetch the time right now. Try again in a moment.");
    } finally {
      searchBtn.disabled = false;
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleSearch();
  });

  // Clean up the interval if the user navigates away
  window.addEventListener("beforeunload", stopTicking);
})();
