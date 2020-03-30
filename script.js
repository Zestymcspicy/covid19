let stateData, countyData, parsedStates, currentState, currentCounty;
const getData = type => {
  return fetch(
    `https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-${type}.csv`, {
      method: 'GET',
    }
  ).then(response => response.text()).then(data => parseCSV(data, type))
};

const getCountyData = () => {
  return fetch(
    "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv", {
      method: 'GET',
    }
  ).then(response => response.text()).then(data => parseCSV(data, "county"))
};

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
  })
  console.log(parsedStates)
}

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

const selectState = e => {
  currentState = parsedStates[`${e.target.value}`].byCounty
  console.log(currentState)
  addData(parsedStates[e.target.value].byDate, "state")
  populateDropdown(currentState, "counties")
}

const selectCounty = e => {
  currentCounty = currentState[`${e.target.value}`]
  console.log(currentCounty)
  addData(currentCounty, "county")
}

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
