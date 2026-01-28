/* ================= CONFIG ================= */

const WEATHER_API_KEY = "965aa4f8d2dc22239b87ce4ce1bf057b";

const PANEL_AREA = 1.7;
const PANEL_POWER = 400;
const PACKING_FACTOR = 1.1;
const SETBACK_FACTOR = 0.10;
const PSH = 5;
const MAX_ZOOM = 18;
const GRID_CO2_FACTOR = 0.82;

/* ================= STATE ================= */

let lastPanels = null;
let lastCapacityKW = null;
let lastCloud = null;
let lastTemp = null;
let userMarker = null;

/* ================= MAP INIT ================= */

const map = L.map("map", {
  minZoom: 5,
  maxZoom: MAX_ZOOM
}).setView([22.5726, 88.3639], 17);

L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { attribution: "Tiles © Esri", maxZoom: MAX_ZOOM }
).addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

map.addControl(new L.Control.Draw({
  draw: {
    polygon: true,
    rectangle: true,
    circle: false,
    polyline: false,
    marker: false,
    circlemarker: false
  },
  edit: { featureGroup: drawnItems }
}));

/* ================= WEATHER ================= */

async function getWeather(lat, lon) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather?` +
    `lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API failed");
  return await res.json();
}

/* ================= MODELS ================= */

function basicModel(capacityKW, cloudPercent) {
  const cloudFactor = 1 - cloudPercent / 100;
  return capacityKW * PSH * cloudFactor * 0.85;
}

function advancedModel(panels, cloudPercent, airTemp) {
  const capacityKW = (panels * PANEL_POWER) / 1000;
  const cloudFactor = 1 - (0.75 * cloudPercent / 100);
  const cellTemp = airTemp + 30;
  const tempFactor = 1 - (0.0035 * (cellTemp - 25));
  return capacityKW * PSH * 1.12 * cloudFactor * tempFactor * 0.89;
}

/* ================= ENERGY ================= */

function recalculateEnergy() {
  if (
    lastPanels === null ||
    lastCapacityKW === null ||
    lastCloud === null ||
    lastTemp === null
  ) return;

  const isAdvanced = document.getElementById("modelToggle").checked;

  const daily = isAdvanced
    ? advancedModel(lastPanels, lastCloud, lastTemp)
    : basicModel(lastCapacityKW, lastCloud);

  const monthly = daily * 30;
  const yearly = daily * 365;

  document.getElementById("daily").innerText = daily.toFixed(2);
  document.getElementById("monthly").innerText = monthly.toFixed(2);
  document.getElementById("yearly").innerText = yearly.toFixed(2);

  calculateCO2Reduction(daily);
}

/* ================= DRAW EVENT ================= */

map.on(L.Draw.Event.CREATED, async (e) => {
  drawnItems.clearLayers();
  drawnItems.addLayer(e.layer);

  const area = turf.area(e.layer.toGeoJSON());
  const usableArea = area * (1 - SETBACK_FACTOR);

  const panels = Math.floor(usableArea / (PANEL_AREA * PACKING_FACTOR));
  const capacityKW = (panels * PANEL_POWER) / 1000;

  document.getElementById("area").innerText = area.toFixed(1);
  document.getElementById("panels").innerText = panels;
  document.getElementById("capacity").innerText = capacityKW.toFixed(2);

  try {
    const center = map.getCenter();
    const weather = await getWeather(center.lat, center.lng);

    lastPanels = panels;
    lastCapacityKW = capacityKW;
    lastCloud = weather.clouds?.all ?? 0;
    lastTemp = weather.main?.temp ?? 25;

    recalculateEnergy();
  } catch {
    alert("Weather data unavailable");
  }
});

/* ================= GEO CODING ================= */

async function geocodeLocation(location) {
  if (location.includes(",")) {
    const [lat, lon] = location.split(",").map(Number);
    return { lat, lon };
  }

  const url =
    `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${WEATHER_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!data.length) throw new Error("Location not found");

  return { lat: data[0].lat, lon: data[0].lon };
}

/* ================= MANUAL CALC ================= */

document.getElementById("manualCalcBtn").addEventListener("click", async () => {
  const area = Number(document.getElementById("manualArea").value);
  const locationText = document.getElementById("manualLocation").value;

  if (!area || !locationText) {
    alert("Please enter both area and location");
    return;
  }

  try {
    const { lat, lon } = await geocodeLocation(locationText);
    const weather = await getWeather(lat, lon);

    const usableArea = area * (1 - SETBACK_FACTOR);
    const panels = Math.floor(usableArea / (PANEL_AREA * PACKING_FACTOR));
    const capacityKW = (panels * PANEL_POWER) / 1000;

    lastPanels = panels;
    lastCapacityKW = capacityKW;
    lastCloud = weather.clouds.all;
    lastTemp = weather.main.temp;

    document.getElementById("area").innerText = area.toFixed(1);
    document.getElementById("panels").innerText = panels;
    document.getElementById("capacity").innerText = capacityKW.toFixed(2);

    map.setView([lat, lon], 17);
    map.invalidateSize();

    recalculateEnergy();
  } catch {
    alert("Failed to calculate. Check inputs.");
  }
});

/* ================= SEARCH ================= */

document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("searchLocation").value;
  if (!query) return alert("Enter a location");

  try {
    const { lat, lon } = await geocodeLocation(query);
    map.setView([lat, lon], 17);
    map.invalidateSize();
  } catch {
    alert("Location not found");
  }
});

/* ================= USE CURRENT LOCATION (FIXED) ================= */

document.getElementById("useLocationBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      map.setView([lat, lon], 18);
      map.invalidateSize();

      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup("Your current location")
        .openPopup();

      try {
        const weather = await getWeather(lat, lon);
        lastCloud = weather.clouds?.all ?? 0;
        lastTemp = weather.main?.temp ?? 25;

        if (lastPanels !== null) recalculateEnergy();
      } catch {
        alert("Weather unavailable for your location");
      }
    },
    () => {
      alert("Location permission denied");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

/* ================= CO2 ================= */

function calculateCO2Reduction(dailyEnergy) {
  if (!dailyEnergy || dailyEnergy <= 0) return;

  document.getElementById("co2Daily").innerText =
    (dailyEnergy * GRID_CO2_FACTOR).toFixed(1);

  document.getElementById("co2Monthly").innerText =
    (dailyEnergy * 30 * GRID_CO2_FACTOR).toFixed(1);

  document.getElementById("co2Yearly").innerText =
    (dailyEnergy * 365 * GRID_CO2_FACTOR).toFixed(1);
}

/* ================= TOGGLE ================= */

document
  .getElementById("modelToggle")
  .addEventListener("change", recalculateEnergy);
