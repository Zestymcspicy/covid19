//initialize some global variables
let stateData,
  countyData,
  parsedStates,
  currentState,
  currentCounty,
  stateDictionary = {};

stateGeoJson.features.forEach(
  x => (stateDictionary[x.properties.STATE] = x.properties.NAME)
);
//fetch data function for both county and state information
const getData = type => {
  return fetch(
    `https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-${type}.csv`,
    {
      method: "GET"
    }
  )
    .then(response => response.text())
    .then(data => parseCSV(data, type));
};

//takes a csv and turns it into an array of objects then passes it dependent on type
const parseCSV = (csv, type) => {
  csv = csv.split("\n").map(x => x.split(","));
  let legend = csv.shift();
  csv = csv.map(point => {
    let obj = {};
    legend.forEach((prop, index) => {
      obj[prop] = point[index];
    });
    return obj;
  });
  if (type === "states") {
    stateData = csv;
    parseStates(stateData);
    getData("counties");
  } else {
    countyData = csv;
    addCounties();
  }
};

//handle the state data
const parseStates = arr => {
  parsedStates = {};
  arr.forEach(point => {
    if (parsedStates[`${point.state}`] === undefined) {
      parsedStates[`${point.state}`] = {
        byDate: []
      };
      parsedStates[`${point.state}`].byCounty = {};
    }
    parsedStates[`${point.state}`].byDate.push(point);
  });
};

//add counties to the state data
const addCounties = () => {
  countyData.forEach(point => {
    if (parsedStates[`${point.state}`] === undefined) {
      parsedStates[`${point.state}`] = {
        byCounty: {}
      };
    }
    if (
      parsedStates[`${point.state}`].byCounty[`${point.county}`] === undefined
    ) {
      parsedStates[`${point.state}`].byCounty[`${point.county}`] = [];
    }
    parsedStates[`${point.state}`].byCounty[`${point.county}`].push(point);
  });
  populateDropdown(parsedStates, "states");
  nextFuncs();
};

//state selection function
const selectState = e => {
  currentState = parsedStates[`${e.target.value}`].byCounty;
  addData(parsedStates[e.target.value].byDate, "state");
  populateDropdown(currentState, "counties");
};

//county selection function
const selectCounty = e => {
  currentCounty = currentState[`${e.target.value}`];
  addData(currentCounty, "county");
};

//adds data to the page
const addData = (data, type) => {
  let dataContainer;
  if (type === "county") {
    dataContainer = document.getElementById("countyDataContainer");
  } else {
    dataContainer = document.getElementById("stateDataContainer");
  }
  while (dataContainer.lastChild) {
    dataContainer.removeChild(dataContainer.lastChild);
  }
  data.forEach(item => {
    dataContainer.insertAdjacentHTML(
      "beforeend",
      `<p>Date: ${item.date} Cases: ${item.cases}<p>`
    );
  });
};

//add information to the dropdown
const populateDropdown = (obj, type) => {
  let dropdown;
  if (type === "states") {
    dropdown = document.getElementById("stateInput");
    dropdown.addEventListener("change", e => selectState(e));
  } else {
    dropdown = document.getElementById("countyInput");
    dropdown.addEventListener("change", e => selectCounty(e));
    while (dropdown.lastChild) {
      dropdown.removeChild(dropdown.lastChild);
    }
  }
  let arr = [];
  for (x in obj) {
    arr.push(x);
  }
  arr = arr.sort();
  arr.forEach(item => {
    dropdown.insertAdjacentHTML(
      "beforeend",
      `<option class="state-option" value="${item}">${item}</option>`
    );
  });
};
getData("states");

const nextFuncs = () => {
  stateGeoJson.features.forEach(x => {
    x.properties.CASES = Number(
      parsedStates[x.properties.NAME].byDate.pop().cases
    );
    x.properties.DEATHS = Number(
      parsedStates[x.properties.NAME].byDate.pop().deaths
    );
    parsedStates[x.properties.NAME].id = x.properties.STATE;
  });
  countyGeoJson.features.forEach(x => {
    const state = stateDictionary[x.properties.STATE];
    if (parsedStates[state].byCounty[x.properties.NAME] !== undefined) {
      let cases = parsedStates[state].byCounty[x.properties.NAME];
      x.properties.CASES = Number(cases[cases.length - 1].cases);
      x.properties.DEATHS = Number(cases[cases.length - 1].deaths)
    } else {
      x.properties.CASES = 0;
      x.properties.DEATHS = 0;
    }
  });
  loadData();
};

mapboxgl.accessToken =
  "pk.eyJ1IjoiemVzdHltY3NwaWN5IiwiYSI6ImNqc281djVneTA5MzAzeXJ2ZWVoMjhmdzMifQ.uT5Hz9PEBvuLwVrZkrkp8A";
var map = new mapboxgl.Map({
  container: "map", // container id
  style: "mapbox://styles/zestymcspicy/ck8dcvwc43us61jp2xvefkhri",
  center: [-93.38, 38], // starting position
  zoom: 3 // starting zoom
});

const loadData = () => {
  map.addSource("counties", {
    type: "geojson",
    data: countyGeoJson
  });

  map.addSource("states", {
    type: "geojson",
    data: stateGeoJson
  });

  map.addLayer({
    id: "county-borders",
    type: "line",
    source: "counties",
    layout: {},
    minzoom: 6,
    paint: {
      "line-color": "#000000",
      "line-opacity": 0.4,
      "line-width": 0.5
    }
  });

  map.addLayer({
    id: "state-borders",
    type: "line",
    source: "states",
    layout: {},
    minzoom: 6,
    paint: {
      "line-color": "#000000",
      "line-opacity": 0.6,
      "line-width": 1
    }
  });

  map.addLayer(
    {
      id: "state-covid",
      source: "states",
      maxzoom: 6,
      type: "fill",
      filter: ["has", "CASES"],
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", "CASES"],
          0,
          "#438532",
          1,
          "#F2F12D",
          50,
          "#EED322",
          100,
          "#E6B71E",
          250,
          "#DA9C20",
          500,
          "#CA8323",
          1000,
          "#B86B25",
          2500,
          "#eb480f",
          5000,
          "#da3e00",
          10000,
          "#ab1414",
          20000,
          "#ff0000"
        ],
        "fill-opacity": 0.75
      }
    },
    "waterway-label"
  );

  map.addLayer(
    {
      id: "county-covid",
      source: "counties",
      minzoom: 6,
      type: "fill",
      filter: ["has", "CASES"],
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", "CASES"],
          0,
          "#438532",
          1,
          "#F2F12D",
          50,
          "#EED322",
          100,
          "#E6B71E",
          250,
          "#DA9C20",
          500,
          "#CA8323",
          1000,
          "#B86B25",
          2500,
          "#eb480f",
          5000,
          "#da3e00",
          10000,
          "#ab1414",
          20000,
          "#ff0000"
        ],
        "fill-opacity": 0.75
      }
    },
    // "waterway-label"
  );
};
