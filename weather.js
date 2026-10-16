// ===== Weather App =====
// Uses UAPI Weather: https://uapis.cn/api/v1/misc/weather?city=<name>&forecast=true
(function () {
  var form = document.getElementById("weatherForm");
  var cityInput = document.getElementById("cityInput");
  var searchBtn = document.getElementById("searchBtn");
  var statusEl = document.getElementById("weatherStatus");
  var card = document.getElementById("weatherCard");
  var iconEl = document.getElementById("weatherIcon");
  var cityEl = document.getElementById("weatherCity");
  var tempEl = document.getElementById("weatherTemp");
  var condEl = document.getElementById("weatherCondition");
  var extraEl = document.getElementById("weatherExtra");
  var unitToggle = document.getElementById("unitToggle");
  var forecastSection = document.getElementById("forecast");
  var forecastGrid = document.getElementById("forecastGrid");

  if (!form) return;

  var API_URL = "https://uapis.cn/api/v1/misc/weather";

  // Current unit ("c" or "f") and the most recent API response,
  // kept so the unit toggle can re-render without refetching.
  var currentUnit = "c";
  var lastData = null;

  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Map a Chinese weather condition to an emoji icon.
  // Falls back to a generic icon if nothing matches.
  function iconForCondition(weather) {
    if (!weather) return "🌤️";
    var w = weather;
    if (/晴/.test(w)) return "☀️";
    if (/雷/.test(w)) return "⛈️";
    if (/阵雨|雷阵雨/.test(w)) return "⛈️";
    if (/大雨|暴雨|大暴雨|特大暴雨/.test(w)) return "🌧️";
    if (/雨/.test(w)) return "🌦️";
    if (/雪/.test(w)) return "❄️";
    if (/雾|霾/.test(w)) return "🌫️";
    if (/沙|尘/.test(w)) return "🌪️";
    if (/阴/.test(w)) return "☁️";
    if (/多云/.test(w)) return "⛅";
    return "🌤️";
  }

  function celsiusToF(c) {
    return c * 9 / 5 + 32;
  }

  function isNum(v) {
    return v !== undefined && v !== null && v !== "" && !isNaN(v);
  }

  // Format the current temperature with the active unit.
  function fmtCurrent(c) {
    if (!isNum(c)) return "—";
    var val = currentUnit === "f" ? celsiusToF(c) : c;
    return Math.round(val) + "°" + (currentUnit === "f" ? "F" : "C");
  }

  // Format a forecast temperature (degree only; the toggle shows the unit).
  function fmtForecast(c) {
    if (!isNum(c)) return "—";
    var val = currentUnit === "f" ? celsiusToF(c) : c;
    return Math.round(val) + "°";
  }

  function setStatus(text, kind) {
    statusEl.textContent = text || "";
    statusEl.className = "weather-status" + (kind ? " " + kind : "");
  }

  function hideCard() {
    card.hidden = true;
    forecastSection.hidden = true;
  }

  // Render the current weather card from lastData (respects currentUnit).
  function renderCurrent() {
    var data = lastData;
    if (!data) return;

    var city = data.city || data.province || "";
    var province = data.province || "";
    var condition = data.weather || "";
    var temp = data.temperature;
    var windDir = data.wind_direction || "";
    var windPow = data.wind_power || "";
    var humidity = data.humidity;

    iconEl.textContent = iconForCondition(condition);
    cityEl.textContent = city ? city : "Unknown city";
    tempEl.textContent = fmtCurrent(temp);
    condEl.textContent = condition || "—";

    var extras = [];
    if (province && province !== city) extras.push(province);
    if (windDir) extras.push("Wind: " + windDir + (windPow ? " " + windPow : ""));
    if (isNum(humidity)) extras.push("Humidity: " + humidity + "%");
    extraEl.textContent = extras.join("  ·  ");

    card.hidden = false;
  }

  // Render up to 3 forecast days from lastData (respects currentUnit).
  function renderForecast() {
    var data = lastData;
    forecastGrid.innerHTML = "";

    if (!data || !data.forecast || !data.forecast.length) {
      forecastSection.hidden = true;
      return;
    }

    var days = data.forecast.slice(0, 3);
    days.forEach(function (day) {
      var d = day.date ? new Date(day.date + "T00:00:00") : null;
      var dayName = d ? WEEKDAYS[d.getDay()] : (day.week || "—");
      var dateLabel = d ? (MONTHS[d.getMonth()] + " " + d.getDate()) : (day.date || "");

      var cond = day.weather_day || day.weather_night || "";

      var el = document.createElement("div");
      el.className = "forecast-day";

      var nameEl = document.createElement("div");
      nameEl.className = "forecast-dayname";
      nameEl.textContent = dayName;

      var dateEl = document.createElement("div");
      dateEl.className = "forecast-date";
      dateEl.textContent = dateLabel;

      var icEl = document.createElement("div");
      icEl.className = "forecast-icon";
      icEl.textContent = iconForCondition(cond);

      var tempsEl = document.createElement("div");
      tempsEl.className = "forecast-temps";
      var hi = document.createElement("span");
      hi.className = "hi";
      hi.textContent = "H " + fmtForecast(day.temp_max);
      var lo = document.createElement("span");
      lo.className = "lo";
      lo.textContent = "L " + fmtForecast(day.temp_min);
      tempsEl.appendChild(hi);
      tempsEl.appendChild(lo);

      var condEl2 = document.createElement("div");
      condEl2.className = "forecast-cond";
      condEl2.textContent = cond || "—";

      el.appendChild(nameEl);
      el.appendChild(dateEl);
      el.appendChild(icEl);
      el.appendChild(tempsEl);
      el.appendChild(condEl2);

      forecastGrid.appendChild(el);
    });

    forecastSection.hidden = false;
  }

  function showCard(data) {
    lastData = data;
    renderCurrent();
    renderForecast();
  }

  function setLoading() {
    setStatus("Loading...", "loading");
    hideCard();
  }

  function setError(message) {
    setStatus(message, "error");
    hideCard();
    lastData = null;
  }

  async function fetchWeather(city) {
    var url = API_URL + "?city=" + encodeURIComponent(city) + "&forecast=true";
    var response = await fetch(url);
    var data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error("parse");
    }

    // Not found / location error
    if (data && data.error === "LOCATION_NOT_FOUND") {
      return { notFound: true };
    }
    // Invalid parameter or other server error
    if (data && data.error && data.error !== "LOCATION_NOT_FOUND") {
      throw new Error(data.error);
    }
    if (data && data.code === "INVALID_PARAMETER") {
      throw new Error("INVALID_PARAMETER");
    }

    // Must have a temperature or weather field to be considered valid
    if (!data || (data.temperature === undefined && !data.weather)) {
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
    setLoading();

    try {
      var result = await fetchWeather(city);
      if (result.notFound) {
        setError("Couldn't find that city — check the spelling.");
      } else {
        setStatus("");
        showCard(result.data);
      }
    } catch (err) {
      if (err && err.message === "INVALID_PARAMETER") {
        setError("Enter a city first.");
      } else {
        setError("Couldn't fetch weather right now. Try again in a moment.");
      }
    } finally {
      searchBtn.disabled = false;
    }
  }

  function setUnit(unit) {
    if (unit !== "c" && unit !== "f") return;
    if (unit === currentUnit) return;
    currentUnit = unit;

    // Update toggle button states
    if (unitToggle) {
      unitToggle.querySelectorAll(".unit-btn").forEach(function (btn) {
        var active = btn.getAttribute("data-unit") === unit;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    // Re-render using the stored data, if any
    if (lastData) {
      renderCurrent();
      renderForecast();
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleSearch();
  });

  if (unitToggle) {
    unitToggle.addEventListener("click", function (e) {
      var btn = e.target.closest(".unit-btn");
      if (!btn) return;
      setUnit(btn.getAttribute("data-unit"));
    });
  }
})();
