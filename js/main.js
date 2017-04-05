(function(){

        var attrArray = ["million dollars of damage Per person", "Number of fatalities per 100000", "Carbon Emmissions 2013 (t) per capita", "GDP per capita 2015 dollar", "% of 2015 gdp per capita"];
        var expressed = attrArray[0]; //initial attribute

window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = window.innerWidth * 0.475,
        height = 460;


    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
   var projection = d3.geoAlbers()
        .center([-12.73, 55.42])
        .rotate([-24.45, 1.31, 0])
        .parallels([26.77, 58.96])
        .scale(806.06)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/lab-2.csv") //load attributes from csv
        .defer(d3.json, "data/d3_countries.topojson") //load background spatial data
       
        .await(callback);
    
      function callback(error, csvData, europe){
          setGraticule(map, path);
        
        console.log(error);  
        
      var d3countries = topojson.feature(europe, europe.objects.d3_countries);
          
     //variables for data join
          joinData(csvData, d3countries);
    //loop through csv to assign each set of csv attribute values to geojson region
    
          var colorScale = makeColorScale(csvData);
          
          setEnumerationUnits(d3countries, map, path, colorScale);
          
          setChart(csvData, colorScale);
    };
};
    function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
        
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 3000]);
    
    
     var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.adm1_code;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d){
            
            return 463-yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return yScale(parseFloat(d[expressed]) );
            return yScale(parseFloat(d[expressed]) );
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
   /* var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.adm1_code;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - .11*yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        }); */
     var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");
        
     var yAxis = d3.axisLeft()
        .scale(yScale);    
        
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);    
};
    
function setGraticule(map, path){
     var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
           var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
          var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created

};
function joinData (csvData, d3countries){
     for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Country; //the CSV primary key
       
         

        //loop through geojson regions to find correct region
        for (var a=0; a<d3countries.features.length; a++){
            
            var geojsonProps = d3countries.features[a].properties; //the current region geojson properties
            
            var geojsonKey = geojsonProps.admin; //the geojson primary key
            
            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };      
   
      return d3countries; 
};
    function setEnumerationUnits(d3countries, map, path, colorScale){
         var countries = map.selectAll(".countries")
            .data(d3countries.features)
         .enter()
         .append("path")
            .attr("class", "countries")
            .attr("d", path)
            .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        });
    };
    function makeColorScale(data){
    var colorClasses = [
        "#edf8e9",
        "#bae4b3",
        "#74c476",
        "#31a354",
        "#006d2c"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};
    function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};
})();