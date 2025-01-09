// JS for the map
const map = L.map('map', { center: [50.08, 14.44], zoom: 6 });

// BASEMAPS
const CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
}).addTo(map);

const USGS_USImageryTopo = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 20,
  attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
});

const CartoDB_Voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
});
const baseMaps = {
  'Dark Matter': CartoDB_DarkMatter,
  'USGS Imagery Topo': USGS_USImageryTopo,
  'CartoDB Voyager': CartoDB_Voyager,
};

// Select for basemaps
L.control.layers(baseMaps).addTo(map);


// CITIES
//Icon styling


function onEachFeature(feature, layer) {
  layer.bindPopup(`
    <strong>City:</strong> ${feature.properties.name}<br>
    <strong>Country:</strong> ${feature.properties.country}<br>
    <strong>Population:</strong> ${feature.properties.population}<br>
  `);
}
const citiesGeojsonPath = 'data/cities.geojson'; 

fetch(citiesGeojsonPath)
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng); 
      },
      onEachFeature: onEachFeature 
    }).addTo(map);
  })
  .catch(error => {
    console.error('Chyba při načítání GeoJSON souboru:', error);
  });


// STYLING AND POP-UPS
let railwayLines = L.geoJSON(null, {
  style: feature => ({
    color: '#fca311', // Orange color for lines
    weight: 2,
    opacity: 1, // All lines visible
  }),
  onEachFeature: (feature, layer) => {
    // Creating a structured popup
    layer.bindPopup(`
      <strong>Route:</strong> ${feature.properties.MainOrigin} → ${feature.properties.MainDesti}<br>
      <strong>Via:</strong> ${[feature.properties.Via1, feature.properties.Via2, feature.properties.Via3].filter(via => via).join(' → ')}<br>
      <strong>Operated By:</strong> ${feature.properties.OperatedBy}<br>
      <strong>Aprox. Ticket Price:</strong> ${feature.properties.AprPriceOD} €<br>
      <strong>Notes:</strong> ${feature.properties.Notesx || 'None'}
    `);
  },
}).addTo(map);


// LOAD DATA - SAFE VERSION
const geojsonPath = 'data/rail_data.geojson'; // Path to file
fetch(geojsonPath)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error loading file: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    railwayLines.addData(data); // Add data to the layer
    console.log('GeoJSON data successfully loaded:', data);
  })
  .catch(error => {
    console.error('Failed to load GeoJSON file:', error);
  });

// SEARCH ENGINE for filtering
document.getElementById('search-btn').addEventListener('click', () => {
  const searchValue = document.getElementById('search').value.toLowerCase();

  // Clear previous selected layers and table
  selectedLayers.clear();
  const tbody = document.getElementById('selected-lines-tbody');
  tbody.innerHTML = ''; // Clear all rows in the table

  railwayLines.eachLayer(layer => {
    const { MainOrigin, MainDesti, OperatedBy } = layer.feature.properties;
    if (
      MainOrigin.toLowerCase().includes(searchValue) ||
      MainDesti.toLowerCase().includes(searchValue) ||
      OperatedBy.toLowerCase().includes(searchValue)
    ) {
      layer.setStyle({ color: 'red', weight: 4 }); // Highlighted route
      // Add route and operator to the table
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${layer.feature.properties.MainOrigin} → ${layer.feature.properties.MainDesti}</td>
        <td>${layer.feature.properties.OperatedBy}</td>
        <td>${layer.feature.properties.AprPriceOD ? layer.feature.properties.AprPriceOD : 'N/A'} €</td>
        <td>${layer.feature.properties.Time_OD ? layer.feature.properties.Time_OD : 'N/A'} h</td>
        <td>${layer.feature.properties.Notesx ? layer.feature.properties.Notesx : 'No additional notes'}</td>
      `;
      tbody.appendChild(row);
    } else {
      layer.setStyle({ color: '#fca311', weight: 2 }); // Default style
    }
  });

  if (tbody.children.length > 0) {
    document.getElementById('selected-lines-table').style.bottom = '0'; // Show table
  } else {
    document.getElementById('selected-lines-table').style.bottom = '-300px'; // Hide table
  }
});

// Operator filter
document.getElementById('operator-select').addEventListener('change', () => {
  const selectedOperator = document.getElementById('operator-select').value.toLowerCase();

  // Clear previous selected layers and table
  selectedLayers.clear();
  const tbody = document.getElementById('selected-lines-tbody');
  tbody.innerHTML = ''; // Clear all rows in the table

  railwayLines.eachLayer(layer => {
    const { OperatedBy } = layer.feature.properties;
    if (!selectedOperator || OperatedBy.toLowerCase() === selectedOperator) {
      layer.setStyle({ color: 'red', weight: 4 }); // Highlighted route
      // Add route and operator to the table
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${layer.feature.properties.MainOrigin} → ${layer.feature.properties.MainDesti}</td>
        <td>${layer.feature.properties.OperatedBy}</td>
        <td>${layer.feature.properties.AprPriceOD ? layer.feature.properties.AprPriceOD : 'N/A'} €</td>
        <td>${layer.feature.properties.Time_OD ? layer.feature.properties.Time_OD : 'N/A'} h</td>
        <td>${layer.feature.properties.Notesx ? layer.feature.properties.Notesx : 'No additional notes'}</td>
      `;
      tbody.appendChild(row);
    } else {
      layer.setStyle({ color: '#fca311', weight: 2 }); // Default style
    }
  });

  if (tbody.children.length > 0) {
    document.getElementById('selected-lines-table').style.bottom = '0'; // Show table
  } else {
    document.getElementById('selected-lines-table').style.bottom = '-300px'; // Hide table
  }
});

// Table update after search or lasso selection
document.getElementById('time-range').addEventListener('input', event => {
  const maxTime = event.target.value;
  document.getElementById('time-range-label').textContent = `0 - ${maxTime} h`;

  // RESET TABLE
  selectedLayers.clear();
  const tbody = document.getElementById('selected-lines-tbody');
  tbody.innerHTML = ''; 

  // Update styles and table
  railwayLines.eachLayer(layer => {
    const { Time_OD } = layer.feature.properties;
    if (Time_OD <= maxTime) {
      layer.setStyle({ opacity: 1 });
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${layer.feature.properties.MainOrigin} → ${layer.feature.properties.MainDesti}</td>
        <td>${layer.feature.properties.OperatedBy}</td>`;
      tbody.appendChild(row);
    } else {
      layer.setStyle({ opacity: 0 }); // Invisible line if not in duration range
    }
  });

  // Show table if there are any lines
  if (tbody.children.length > 0) {
    document.getElementById('selected-lines-table').style.bottom = '0'; // SHOW
  } else {
    document.getElementById('selected-lines-table').style.bottom = '-300px'; // HIDE
  }
});

// Filter on duration
window.addEventListener('load', () => {
  const timeRange = document.getElementById('time-range');
  timeRange.value = 20; // Default maximum filter value
  document.getElementById('time-range-label').textContent = `0 - 20 h`;
});

// LASSO SELECTION based on https://github.com/zakjan/leaflet-lasso/tree/master/docs
// Lasso control two options: from sidebar and top right control button
const lassoControl = L.control.lasso({
  position: 'topright', 
  polygon: { color: '#00f', weight: 2 }, 
  intersect: true, 
}).addTo(map);

// VAR for selected layers
let selectedLayers = new Set();

// Event triggered after lasso completion
map.on('lasso.finished', event => {
  // Clear previous selected layers and table
  selectedLayers.clear();
  const tbody = document.getElementById('selected-lines-tbody');
  tbody.innerHTML = ''; // Clear all rows in the table

  // Reset all styles to default
  railwayLines.eachLayer(layer => layer.setStyle({ color: '#fca311', weight: 2 }));

  // Highlight selected layers
  event.layers.forEach(layer => {
    selectedLayers.add(layer.feature.properties.id); // Add ID to selection
    layer.setStyle({ color: 'red', weight: 4 }); // Highlight selected layers

    // Add route and operator to the table
    let row = document.createElement('tr');
    row.innerHTML = `
      <td>${layer.feature.properties.MainOrigin} → ${layer.feature.properties.MainDesti}</td>
      <td>${layer.feature.properties.OperatedBy}</td>
      <td>${layer.feature.properties.AprPriceOD ? layer.feature.properties.AprPriceOD : 'N/A'} €</td>
      <td>${layer.feature.properties.Time_OD ? layer.feature.properties.Time_OD : 'N/A'} h</td>
      <td>${layer.feature.properties.Notesx ? layer.feature.properties.Notesx : 'No additional notes'}</td>
    `;
    tbody.appendChild(row);
  });

  // Show table if there are selected lines
  if (tbody.children.length > 0) {
    document.getElementById('selected-lines-table').style.bottom = '0'; // Show table
  } else {
    document.getElementById('selected-lines-table').style.bottom = '-300px'; // Hide table
  }
});

// Button to activate lasso
document.getElementById('lasso-btn').addEventListener('click', () => {
  lassoControl.lasso.enable(); // Activate lasso
});
