(function(){
    //initial wrapper function to initalize map and set global  variables
        var attrArray = ["Dollars of Damage per Capita", "Number of Fatalities per 100000", "Carbon Emmissions 2013 (t) per Capita", "GDP per Capita", "% of 2015 GDP per Capita"];
        var expressed = attrArray[0]; 
            //initial attribute
        
        var chartWidth = window.innerWidth * 0.45,
            chartHeight = 473,
            leftPadding = 30,
            rightPadding = 0,
            topBottomPadding = 5,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
        var yScale = d3.scaleLinear()
            .range([463, 0])
            .domain([0, 3000]);
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
        var yAxis = d3.axisLeft()
            .scale(yScale);
        
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);
        

window.onload = setMap();

//set up choropleth map
function setMap(){
    //create map frame dimensions
   var width = window.innerWidth * 0.475,
        height = 473;


    //create new svg container for the map
   var map = d3.select("body")
       .append("svg")
       .attr("class", "map")
       .attr("width", width)
       .attr("height", height);

    //create Albers equal area conic projection centered on europe
   var projection = d3.geoAlbers()
       .center([-12.73, 55.42])
       .rotate([-24.45, 1.31, 0])
       .parallels([26.77, 58.96])
       .scale(750)
       .translate([width / 2, height / 2]);
    
   var path = d3.geoPath()
       .projection(projection);
    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
       .defer(d3.csv, "data/lab-2.csv") //load attributes from csv
       .defer(d3.json, "data/d3_countries.topojson") //load background spatial data
       
       .await(callback);
    
function callback(error, csvData, europe){
     //recieves the data once called    
     setGraticule(map, path);
     console.log(error);  
        
     var d3countries = topojson.feature(europe, europe.objects.d3_countries);
          
    //variables for data join
     joinData(csvData, d3countries);
    //loop through csv to assign each set of csv attribute values to geojson region
    
     var colorScale = makeColorScale(csvData);
          
     setEnumerationUnits(d3countries, map, path, colorScale);
          
     setChart(csvData, colorScale);
     createDropdown(csvData);
    };
};
    function setChart(csvData, colorScale){
    //creates chart variables
    
     var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm0_a3;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
     var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
   
     var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");

    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);   
    setPanel();    
    updateChart(bars, csvData.length, colorScale);    
};
function setGraticule(map, path){
    //creates a graticule
     var graticule = d3.geoGraticule()
        .step([5, 5]); 
    //place graticule lines every 5 degrees of longitude and latitude
     var gratLines = map.selectAll(".gratLines") 
     //select graticule elements that will be created
        .data(graticule.lines()) 
     //bind graticule lines to each element to be created
        .enter() 
     //create an element for each datum
        .append("path") 
     //append each element to the svg as a path element
        .attr("class", "gratLines") 
     //assign class for styling
        .attr("d", path); 
    //project graticule lines
     var gratLines = map.selectAll(".gratLines") 
     //select graticule elements that will be created
};
function joinData (csvData, d3countries){
    //Joins the csv to the topoJson
     for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.adm0_a3; //the CSV primary key
        //loop through geojson regions to find correct region
        for (var a=0; a<d3countries.features.length; a++){
            var geojsonProps = d3countries.features[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.adm0_a3;
            //the geojson primary key
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
            .attr("class", function(d){
                return "countries " + d.properties.adm0_a3;
            })
            .attr("d", path)
            .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
            .on("mouseover", function(d){
                highlight(d.properties);
        })
            .on("mouseout", function(d){
                dehighlight(d.properties)
        })
            .on("mousemove", moveLabel);
         var desc = countries.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};
    function makeColorScale(data){
    //Creates a color scale and choropleth for the data
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
function createDropdown(csvData){
    //creates and adds functionality for the dropdown menu
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};   
    function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;   
    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var countries = d3.selectAll(".countries")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

    updateChart(bars, csvData.length, colorScale);                
};
  
    function updateChart(bars, n, colorScale){
    //updates scale and positions scale
    updateScale(expressed);
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
       
    var chartTitle = d3.select(".chartTitle")
        .text(expressed);
};
    function highlight(props){
    //highlights selected objects
    //change stroke   
    var selected = d3.selectAll("." + props.adm0_a3)
        .style("stroke", "blue")
        .style("stroke-width", "2");
        setLabel(props);
};
function dehighlight(props){
    //dehighlights selected features
    var selected = d3.selectAll("." + props.adm0_a3)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    
    function getStyle(element, styleName){
        //gets the style so that only highlighted objects are       dehighlighted
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);
            d3.select(".infolabel")
            .remove();
            return styleObject[styleName];
    };
};
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";
       
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.admin + "_label")
        .html(labelAttribute);

    var countryName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};
function moveLabel(){
    //use coordinates of mousemove event to set label coordinates
    var x = d3.event.clientX + 10,
        y = d3.event.clientY - 75;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
}; 
function setPanel(){
    //creates a panel providing cintext and metadata
    var text = '<h1>Economic Effects of Climate Change and Natural Disasters</h1>' + "<b><h3>This map relates how climate change and the disasters it causes have a large and widespread impact across Europe. The data covers losses due to climate change from 1980-2015 and relates it to each country's 2015 GDP. Some countries, such as Estonia, have been spared from much of the effects, Whereas others, such as Germany, have sustained losses totaling more than a quarter of its 2015 GDP.</H3></b>" + "<b><p>Basemap data from Natural Earth. Country data from the World Bank. Created by Peter Nielsen with d3. All values are in the 2015 US Dollar.</p></b>";
    
   var panel = d3.select("body")
        .append("div")
        .attr("class", "panel")
        .attr("width", window.innerWidth * .95)
        .attr("height", 60)
   var panelText = panel.append("div")
        .attr("class", "text")
        .html(text);
       
}
function updateScale(expressed){
    //resets the scale of the chart to properly show the data
    if (expressed == "Dollars of Damage per Capita"){
        yScale.domain([0, 3000]);
        axis.call(yAxis);
    }
    else if (expressed == "Number of Fatalities per 100000"){
       yScale.domain([0, 200]);
       axis.call(yAxis);
            
    }
    else if (expressed == "Carbon Emmissions 2013 (t) per Capita"){
        yScale.domain([0, 210]); 
        axis.call(yAxis);
    }
    else if (expressed == "GDP per Capita"){
        yScale.domain([0, 120000]); 
        axis.call(yAxis);
    }
    else if (expressed == "% of 2015 GDP per Capita"){
        yScale.domain([0, 40]);
        axis.call(yAxis);
    };
}
    
})();