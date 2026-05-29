/**
 * Bhojana Compendium — client-side archive UI.
 * Data source: locations.json (generated from images/ by generate_locations.py).
 */

const state = {
  locations: [],
  selectedName: null,
  searchQuery: "",
};

const elements = {
  search: document.getElementById("search"),
  locationsList: document.getElementById("locations"),
  locationsMessage: document.getElementById("locations-message"),
  gallery: document.getElementById("gallery"),
};

function normalizeQuery(query) {
  return query.trim().toLowerCase();
}

function getFilteredLocations() {
  const q = normalizeQuery(state.searchQuery);
  if (!q) return state.locations;
  return state.locations.filter((loc) =>
    loc.name.toLowerCase().includes(q)
  );
}

function getLocationByName(name) {
  return state.locations.find((loc) => loc.name === name) ?? null;
}

function selectLocation(name) {
  state.selectedName = name;
  renderLocationList();
  renderGallery();
}

function renderLocationList() {
  const filtered = getFilteredLocations();
  const { locationsList, locationsMessage } = elements;

  locationsList.replaceChildren();
  locationsList.hidden = false;
  locationsMessage.hidden = true;

  if (filtered.length === 0) {
    locationsList.hidden = true;
    locationsMessage.hidden = false;
    locationsMessage.innerHTML = `
      <p>Location not found.</p>
      <p class="locations-message__contact">Want it added? Contact the archive administrator.</p>
    `;
    return;
  }

  filtered.forEach((location) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "location-card";
    card.setAttribute("role", "listitem");
    if (location.name === state.selectedName) {
      card.classList.add("is-selected");
    }

    const count = location.images?.length ?? 0;
    const countLabel =
      count === 1 ? "1 photograph" : `${count} photographs`;

    card.innerHTML = `
      <span class="location-card__name"></span>
      <span class="location-card__count"></span>
    `;
    card.querySelector(".location-card__name").textContent = location.name;
    card.querySelector(".location-card__count").textContent = countLabel;

    card.addEventListener("click", () => selectLocation(location.name));
    locationsList.appendChild(card);
  });
}

function renderGallery() {
  const { gallery } = elements;

  if (!state.selectedName) {
    gallery.innerHTML =
      '<p class="gallery-placeholder">Select a location to view its archive.</p>';
    return;
  }

  const location = getLocationByName(state.selectedName);
  if (!location) {
    gallery.innerHTML =
      '<p class="gallery-placeholder">Select a location to view its archive.</p>';
    return;
  }

  const images = location.images ?? [];
  const heading = document.createElement("h2");
  heading.className = "gallery-heading";
  heading.textContent = location.name;

  gallery.replaceChildren(heading);

  if (images.length === 0) {
    const empty = document.createElement("p");
    empty.className = "gallery-empty";
    empty.textContent =
      "No images currently available for this location.";
    gallery.appendChild(empty);
    return;
  }

  const grid = document.createElement("ul");
  grid.className = "gallery-grid";

  images.forEach((src) => {
    const item = document.createElement("li");
    item.className = "gallery-grid__item";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Archive photograph from ${location.name}`;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      img.alt = "Image could not be loaded";
      img.classList.add("gallery-error");
    });

    item.appendChild(img);
    grid.appendChild(item);
  });

  gallery.appendChild(grid);
}

function handleSearchInput(event) {
  state.searchQuery = event.target.value;
  const filtered = getFilteredLocations();
  if (
    state.selectedName &&
    !filtered.some((loc) => loc.name === state.selectedName)
  ) {
    state.selectedName = null;
  }
  renderLocationList();
  renderGallery();
}

async function loadLocations() {
  try {
    const response = await fetch("locations.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    state.locations = Array.isArray(data.locations) ? data.locations : [];
  } catch (err) {
    console.error("Failed to load locations:", err);
    state.locations = [];
    elements.locationsMessage.hidden = false;
    elements.locationsMessage.innerHTML =
      '<p class="gallery-error">Could not load location data. Check that locations.json is available.</p>';
    elements.locationsList.hidden = true;
    return;
  }

  renderLocationList();
  renderGallery();
}

function init() {
  elements.search.addEventListener("input", handleSearchInput);
  loadLocations();
}

init();
