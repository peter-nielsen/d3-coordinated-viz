window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
   var projection = d3.geo.albers()
        .center([-12.73, 55.42])
        .rotate([-24.45, 1.31, 0])
        .parallels([26.77, 58.96])
        .scale(806.06)
        .translate([width / 2, height / 2]);
    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/lab-2.csv") //load attributes from csv
        .defer(d3.json, "data/d3_countries.topojson") //load background spatial data
       
        .await(callback);
    
      function callback(error, csvData, europe){
         var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
           var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
          var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created

        console.log(error);  
        console.log(csvData);
        console.log(europe);
        //var d3_countries = topojson.feature(europe, europe.objects.d3_countries);
        //console.log(d3_countries);
           var countries = map.append("path")
            .datum(europeCountries)
            .attr("class", "countries")
            .attr("d", path);
    };
};