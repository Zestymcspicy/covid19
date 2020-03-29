let stateData, countyData, parsedStates;
const getData = type => {
  return fetch(
    `https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-${type}.csv`,
    {
      method: 'GET',
    }
).then(response => response.text()
).then(data=> parseCSV(data, type))
};

const getCountyData = () => {
  return fetch(
    "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv",
    {
      method: 'GET',
    }
).then(response => response.text()
).then(data=> parseCSV(data, "county"))
};

const parseCSV = (csv, type) => {
  csv = csv.split("\n").map(x=>x.split(","))
  let legend=csv.shift();
  csv = csv.map(point => {
    let obj={};
    legend.forEach((prop, index) => {
      obj[prop]=point[index];
    })
    return obj;
  })
  if(type==="states"){
    stateData=csv;
    parseStates(stateData);
  }  else {
    countyData=csv;
  }
}

const parseStates = (obj) => {

}

getData("states");
getData("counties");
