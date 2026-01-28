
const WEATHER_API_KEY = "965aa4f8d2dc22239b87ce4ce1bf057b";

const PANEL_AREA = 1.7;     
const PANEL_POWER = 400;     
const PACKING_FACTOR = 1.1; 
const SETBACK_FACTOR = 0.10;
const PSH = 5;              
const MAX_ZOOM = 18;

let lastPanels = null;
let lastCapacityKW = null;
let lastCloud = null;
let lastTemp = null;


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

async function getWeather(lat, lon) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather?` +
    `lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API failed");
  return await res.json();
}

function basicModel(capacityKW, cloudPercent) {
  const cloudFactor = 1 - (cloudPercent / 100);
  const systemLoss = 0.85;
  return capacityKW * PSH * cloudFactor * systemLoss;
}

function advancedModel(panels, cloudPercent, airTemp) {
  const capacityKW = (panels * PANEL_POWER) / 1000;

  const cloudFactor = 1 - (0.75 * cloudPercent / 100);

  const cellTemp = airTemp + 30;
  const tempFactor = 1 - (0.0035 * (cellTemp - 25));

  const tiltGain = 1.12;
  const systemLoss = 0.89;

  return capacityKW * PSH * tiltGain * cloudFactor * tempFactor * systemLoss;
}

function recalculateEnergy() {
  if (
    lastPanels === null ||
    lastCapacityKW === null ||
    lastCloud === null ||
    lastTemp === null
  ) return;

  const isAdvanced =
    document.getElementById("modelToggle").checked;

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

map.on(L.Draw.Event.CREATED, async (e) => {
  drawnItems.clearLayers();
  drawnItems.addLayer(e.layer);

  const area = turf.area(e.layer.toGeoJSON());

  const usableArea = area * (1 - SETBACK_FACTOR);
  const panels = Math.floor(
    usableArea / (PANEL_AREA * PACKING_FACTOR)
  );
  const capacityKW = (panels * PANEL_POWER) / 1000;

  document.getElementById("area").innerText = area.toFixed(1);
  document.getElementById("panels").innerText = panels;
  document.getElementById("capacity").innerText = capacityKW.toFixed(2);

  try {
    const center = map.getCenter();
    const weather = await getWeather(center.lat, center.lng);

    const cloud = weather.clouds?.all ?? 0;
    const temp = weather.main?.temp ?? 25;

    lastPanels = panels;
    lastCapacityKW = capacityKW;
    lastCloud = cloud;
    lastTemp = temp;

    recalculateEnergy();
  } catch (err) {
    document.getElementById("daily").innerText = "—";
    document.getElementById("monthly").innerText = "—";
    document.getElementById("yearly").innerText = "—";
    alert("Live weather data unavailable");
  }
});

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

    const cloud = weather.clouds.all;
    const temp = weather.main.temp;

    const usableArea = area * (1 - SETBACK_FACTOR);
    const panels = Math.floor(
      usableArea / (PANEL_AREA * PACKING_FACTOR)
    );
    const capacityKW = (panels * PANEL_POWER) / 1000;

    lastPanels = panels;
    lastCapacityKW = capacityKW;
    lastCloud = cloud;
    lastTemp = temp;

    document.getElementById("area").innerText = area.toFixed(1);
    document.getElementById("panels").innerText = panels;
    document.getElementById("capacity").innerText = capacityKW.toFixed(2);

    recalculateEnergy();

    map.setView([lat, lon], 17);

  } catch (err) {
    alert("Failed to calculate. Check area or location.");
  }
});


document
  .getElementById("modelToggle")
  .addEventListener("change", recalculateEnergy);


  const GRID_CO2_FACTOR = 0.82; 

function calculateCO2Reduction(dailyEnergy) {
  if (!dailyEnergy || dailyEnergy <= 0) return;
  
  const monthlyEnergy = dailyEnergy * 30;
  const yearlyEnergy = dailyEnergy * 365;

  const co2Daily = dailyEnergy * GRID_CO2_FACTOR;
  const co2Monthly = monthlyEnergy * GRID_CO2_FACTOR;
  const co2Yearly = yearlyEnergy * GRID_CO2_FACTOR;

  document.getElementById("co2Daily").innerText =
    co2Daily.toFixed(1);

  document.getElementById("co2Monthly").innerText =
    co2Monthly.toFixed(1);

  document.getElementById("co2Yearly").innerText =
    co2Yearly.toFixed(1);
}


document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("searchLocation").value;
  if (!query) return alert("Enter a location to search");

  try {
    const { lat, lon } = await geocodeLocation(query);
    map.setView([lat, lon], 17);
  } catch (err) {
    alert("Location not found");
  }
});


document.getElementById("useLocationBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      map.setView([lat, lon], 18);

      // Optional: show marker
      L.marker([lat, lon])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    },
    () => {
      alert("Unable to fetch your location");
    }
  );
});
