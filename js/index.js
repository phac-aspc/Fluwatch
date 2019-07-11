var MARGIN = {
    top: 20,
    right: 10,
    bottom: 160,
    left: 150
};

var CATEGORIES = {
    "aH3N2": "#2980b9",
    "aUns": "#e74c3c",
    "aH1N1pdm09": "#F4D03F"
};

var COLOR_SCALE = {
    "0": "#ccc",
    "1-99": "#cbc9e2",
    "100-499": "#9e9ac8",
    "500-999": "#756bb1",
    ">1000": "#54278f",
    "N/A": "#696969",
};

var width = $("#vis").width() - MARGIN.left - MARGIN.right;
var height = 500 - MARGIN.top - MARGIN.bottom;

// importing the data
d3.csv("./data/figure3.csv", function(csv) {
    
    // determining the maximum in the dataset based on the specified keys
    // the only reason this function exists is to reduce code duplication
    var max = function(data) {
        return d3.max(data, function(d) {
            var sum = 0;
            /* using a for loop to calculate the total instead of just grabbing the "aTotal" record from the csv
               allows us to add/remove categories to/from the oject "CATEGORIES" above without having to change anything else */
            for (var i=0; i<Object.keys(CATEGORIES).length; i++){
                sum += +d[Object.keys(CATEGORIES)[i]];
            }
            return sum;
        });
    };

    var data = csv;

    var svg = d3.select('#areachart')
        .append('svg')
        .attr('id', 'vis')
        .attr("width", width + MARGIN.left + MARGIN.right)
        .attr("height", height + MARGIN.top + MARGIN.bottom)
        .append("g")
        .attr("id", "container")
        .attr("transform", "translate(" + MARGIN.left + ", " + MARGIN.top + ")");
   svg
  .append('defs')
  .append('pattern')
    .attr('id', 'diagonalHatch')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 4)
  .append('path')
    .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
    .attr('stroke', '#000000')
    .attr('stroke-width', 1);

    // grouping the data by province SGC code
    // this allows us to access the array of data using province codes from a map
    var fluWatchByProvince = d3.nest()
        .key(function(d) {
            return d["season"];
        })
        .key(function(d) {
            return d["pruid"];
        })
        .key(function(d) {
            return d["startDate"] + "-" + d["endDate"] +", " + d["year"];
        })
        .rollup(function(values) {
            for (var i=0;i<Object.keys(values[0]).length;i++) {
                values[0][Object.keys(values[0])[i]] = values[0][Object.keys(values[0])[i]].replace("<", "").replace(">", "").replace("suppressed", 5).replace("x", 5);
            }
            return values[0];
        })
        .object(data.sort(function(a, b) {
            return d3.ascending(a["year"], b["year"]);
        }));

    var selectedProvince = 1;
    var selectedFluCategory = "all";
    var selectedYear = "2017-2018";

    var allYears = Object.keys(fluWatchByProvince);

    for (var i=0;i<allYears.length;i++) {
        var option = '<option value="' + allYears[i] + '">';
        option += allYears[i] + '</option>';
        document.getElementById("years").innerHTML += option;
    }

    document.getElementById("years").value = selectedYear;

    // accessing the data for the selectedProvince
    var fluData = d3.values(fluWatchByProvince[selectedYear][selectedProvince]).sort(function(a, b) {
        return d3.ascending(new Date(a["endDate"] + " " + a["year"]), new Date(b["endDate"] + " " + b["year"]));
    });

    // setting the original y scale
    var y = d3.scaleLinear()
        .domain([0, max(fluData)])
        .range([0, height]);

    var weeks = extractWeeks(fluData);
    var x = d3.scalePoint().domain(weeks).range([0, width]);

    // using D3's stack function, our values
    var stack = d3.stack().keys(Object.keys(CATEGORIES));
    
    renderAnimationGrid(x, d3.select('#container'));
    drawAreaChart(stack(fluData), y, x, svg);
    
    var animation = new WeeksAnimation(fluWatchByProvince[selectedYear], weeks);
    
    // drawing a map of canada's provinces
    d3.json('./js/maps/provinces.v2.json', function(mapJSON) {
        // populating the provinces dropdown menu with provinces
        for (var i=0;i<mapJSON.objects.provinces.geometries.length;i++) {
            var option = '<option value="' + mapJSON.objects.provinces.geometries[i].properties["PRUID"] + '">';
            option += mapJSON.objects.provinces.geometries[i].properties["PRENAME"] + '</option>';
            document.getElementById("provinces").innerHTML += option;
        }
        
        drawCanada(mapJSON);
        colorMapOnce(fluWatchByProvince[selectedYear], weeks[0]);
    
        animation.play();
    
        d3.select("#weeksRange").attr("min", "0").attr("max", weeks.length - 1);
    
        d3.select("#play-pause").on("click", function() {
            animation.paused ? animation.play() : animation.stop();
        });
    
        d3.select("#restart").on("click", function() {
            animation.restart();
        });
        
        document.getElementById("weekSelected").textContent = weeks[0];
        
        //   colorMap(fluWatchByProvince[selectedYear]);
        d3.selectAll(".province-hash").on("click", function(d) {
            if (fluWatchByProvince[selectedYear][d.properties["PRUID"]] == undefined){
                alert('Data for this province is unavailable');
            }
            else{
                selectedProvince = selectedProvince == d.properties["PRUID"] ? 1 : d.properties["PRUID"];
                d3.selectAll(".province-hash").style("fill", function(d) {
                    return d.properties["PRUID"] == selectedProvince ? "url(#diagonalHatch)" : "transparent";
                });
                
                document.getElementById('provinces').value = selectedProvince;
                
                fluData = d3.values(fluWatchByProvince[selectedYear][selectedProvince]).sort(function(a, b) {
                    return d3.ascending(new Date(a["endDate"] + " " + a["year"]), new Date(b["endDate"] + " " + b["year"]));
                });
    
                var isolatedData = isolateCategory(fluData, selectedFluCategory);
    
                weeks = extractWeeks(fluData);
                x = d3.scalePoint().domain(weeks).range([0, width]);
                // changing the domain to accomodate the new data
                y.domain([0, max(isolatedData)]);
                
                drawAreaChart(stack(isolatedData), y, x, svg);
            }
        });

        document.getElementById('provinces').addEventListener('change', function() {
                // data unavailable
                if (fluWatchByProvince[selectedYear][this.value] == undefined){
                    alert('Data for this province is unavailable');
                    this.value = selectedProvince;
                }
                else {
                    selectedProvince = this.value;
                    d3.selectAll(".province-hash").style("fill", function(d) {
                        return d.properties["PRUID"] == selectedProvince ? "url(#diagonalHatch)" : "transparent";
                    });
                    
                    fluData = d3.values(fluWatchByProvince[selectedYear][selectedProvince]).sort(function(a, b) {
                        return d3.ascending(new Date(a["endDate"] + " " + a["year"]), new Date(b["endDate"] + " " + b["year"]));
                    });
        
                    var isolatedData = isolateCategory(fluData, selectedFluCategory);
        
                    weeks = extractWeeks(fluData);
                    x = d3.scalePoint().domain(weeks).range([0, width]);
                    
                    // changing the domain to accomodate the new data
                    y.domain([0, max(isolatedData)]);
                    drawAreaChart(stack(isolatedData), y, x, svg);
                }
        });
    });

    document.getElementById('flucategory').addEventListener('change', function() {
        selectedFluCategory = this.value;

        var isolatedData = isolateCategory(fluData, selectedFluCategory);
        // changing the domain to accomodate the new data
        y.domain([0, max(isolatedData)]);
        drawAreaChart(stack(isolatedData), y, x, svg);
    });

    d3.selectAll('.path')
        .on('click', function() {
            // toggle selectedFluCategory
            selectedFluCategory = selectedFluCategory == this.id ? "all" : this.id;

            document.getElementById('flucategory').value = selectedFluCategory;

            var isolatedData = isolateCategory(fluData, selectedFluCategory);

            // changing the domain to accomodate the new data
            y.domain([0, max(isolatedData)]);
            drawAreaChart(stack(isolatedData), y, x, svg);
        })
        // retrieving binded data on hover
        .on('mouseover', function() {
            d3.select(this)
                .style("cursor", "pointer");
        });

    document.getElementById("years").addEventListener("change", function() {
        if (fluWatchByProvince[this.value][selectedProvince] == undefined){
            alert('Data for that province during that season is unavailable');
            document.getElementById("years").value = selectedYear;
        }
        else{
            d3.select("#weeksRange").attr("min", "0").attr("max", weeks.length - 1);
            selectedYear = this.value;
            fluData = d3.values(fluWatchByProvince[selectedYear][selectedProvince]).sort(function(a, b) {
                return d3.ascending(new Date(a["endDate"] + " " + a["year"]), new Date(b["endDate"] + " " + b["year"]));
            });
    
            var isolatedData = isolateCategory(fluData, selectedFluCategory);
            weeks = extractWeeks(fluData);
                
            // changing the domain to accomodate the new data
            y.domain([0, max(isolatedData)]);
            x = d3.scalePoint().domain(weeks).range([0, width]);
            
            renderAnimationGrid(x, d3.select('#container'));
            drawAreaChart(stack(isolatedData), y, x, svg);
            
            // restarting the animation
            animation.data = fluWatchByProvince[selectedYear];
            animation.weeks = weeks;
            animation.restart();
        }
    });
    
    document.getElementById("weeksRange").addEventListener("input", function(){
       animation.stop();
       animation.index = parseInt(this.value);
       document.getElementById("weekSelected").textContent = weeks[animation.index];
       colorMap(fluWatchByProvince[selectedYear], weeks[animation.index]);
       animation.highlightGraph();
    });
    
    document.getElementById("weeksRange").addEventListener("change", function(){
       colorMap(fluWatchByProvince[selectedYear], weeks[this.value]);
    });
});