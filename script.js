//initialize some global variables
let stateData, countyData, parsedStates, currentState, currentCounty;

//fetch data function for both county and state information
const getData = type => {
  return fetch(
    `https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-${type}.csv`, {
      method: 'GET',
    }
  ).then(response => response.text()).then(data => parseCSV(data, type))
};

//takes a csv and turns it into an array of objects then passes it dependent on type
const parseCSV = (csv, type) => {
  csv = csv.split("\n").map(x => x.split(","))
  let legend = csv.shift();
  csv = csv.map(point => {
    let obj = {};
    legend.forEach((prop, index) => {
      obj[prop] = point[index];
    })
    return obj;
  })
  if (type === "states") {
    stateData = csv;
    parseStates(stateData);
    getData("counties");
  } else {
    countyData = csv;
    addCounties()
  }
}

//handle the state data
const parseStates = (arr) => {
  parsedStates = {};
  arr.forEach(point => {
    if (parsedStates[`${point.state}`] === undefined) {
      parsedStates[`${point.state}`] = {
        byDate: []
      }
      parsedStates[`${point.state}`].byCounty = {}
    }
    parsedStates[`${point.state}`].byDate.push(point);
  });
};

//add counties to the state data
const addCounties = () => {
  countyData.forEach(point => {
    if(parsedStates[`${point.state}`]===undefined){
      parsedStates[`${point.state}`] = {
        byCounty : {}
      }
    }
    if (parsedStates[`${point.state}`].byCounty[`${point.county}`] === undefined) {
      parsedStates[`${point.state}`].byCounty[`${point.county}`] = [];
    }
    parsedStates[`${point.state}`].byCounty[`${point.county}`].push(point);
  })
  populateDropdown(parsedStates, "states")
}

//state selection function
const selectState = e => {
  currentState = parsedStates[`${e.target.value}`].byCounty
  addData(parsedStates[e.target.value].byDate, "state")
  populateDropdown(currentState, "counties")
}

//county selection function
const selectCounty = e => {
  currentCounty = currentState[`${e.target.value}`]
  addData(currentCounty, "county")
}

//adds data to the page
const addData = (data, type)=> {
  let dataContainer;
  if(type==="county"){
    dataContainer = document.getElementById("countyDataContainer");
  } else {
    dataContainer = document.getElementById("stateDataContainer")
  }
  while (dataContainer.lastChild){
    dataContainer.removeChild(dataContainer.lastChild)
  }
  data.forEach(item=> {
    dataContainer.insertAdjacentHTML("beforeend", `<p>Date: ${item.date} Cases: ${item.cases}<p>`)
  })
}

//add information to the dropdown
const populateDropdown = (obj, type) => {
  let dropdown;
  if(type==="states"){
    dropdown = document.getElementById("stateInput")
    dropdown.addEventListener("change", e => selectState(e))
  }else{
    dropdown = document.getElementById("countyInput")
    dropdown.addEventListener("change", e=> selectCounty(e))
    while (dropdown.lastChild){
      dropdown.removeChild(dropdown.lastChild)
    }
  }
  let arr = []
  for(x in obj){
    arr.push(x);
  }
  arr=arr.sort()
  arr.forEach(item => {
    dropdown.insertAdjacentHTML("beforeend", `<option class="state-option" value="${item}">${item}</option>`)
  })
}
getData("states");
