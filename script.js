async function loadLocations() {
    const response = await fetch("locations.json");
    const data = await response.json();

    const locationsDiv = document.getElementById("locations");

    data.locations.forEach(location => {
        const button = document.createElement("button");
        button.textContent = location.name;

        button.onclick = () => {
            document.getElementById("gallery").innerHTML =
                `<h2>${location.name}</h2>`;
        };

        locationsDiv.appendChild(button);
    });
}

loadLocations();
