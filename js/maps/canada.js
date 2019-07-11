function drawCanada(map) {
   var svg = d3.select('#map')
      .append('svg')
      .attr('width', $("#map-container").width())
      .attr('height', $("#map-container").width());

   var area = topojson.feature(map, map.objects.provinces);

   var projection = d3.geoIdentity()
      .reflectY(true)
      .fitExtent([[0, 0], [$("#map-container").width(), $("#map-container").width()]], area);

   var path = d3.geoPath().projection(projection);

   var provinceGroup = svg
      .append('g')
      .attr("id", "mapGroup")
      .selectAll('g')
      .data(area.features)
      .enter();
    
    provinceGroup
      .append("g")
      .append('path')
      .attr("id", function(d) { return d.properties["PRUID"]})
      .attr("class", "province")
      .attr("d", path);
    
    d3.select("#mapGroup")
        .selectAll("g")
        .append("path")
        .attr("class", "province-hash")
        .attr("id", function(d) { return "hash" + d.properties["PRUID"]})
        .attr("d", path)
        .attr("fill", "transparent");
    
    drawLegend(svg);
}

function colorMap(data, week){
    d3.selectAll('.province')
    .transition()
    .style("fill", function(province) {
        var pruid = province.properties["PRUID"];
        
        // if the data is unavailable
        if (data[pruid] == undefined){
            return "#696969";
        }
        
        var total = data[pruid][week]["aTotal"];
        return color(total);
    });
}

function colorMapOnce(data, week){
    d3.selectAll(".province")
        .style("fill", function(province) {
            var pruid = province.properties["PRUID"];
            var total = data[pruid][week]["aTotal"];
            return color(total);
        });
}

function color(value){
    if (value >= 1000) return COLOR_SCALE[">1000"];
    else if (value >= 500) return COLOR_SCALE["500-999"];
    else if (value >= 100) return COLOR_SCALE["100-499"];
    else if (value >= 1) return COLOR_SCALE["1-99"];
    else return COLOR_SCALE["0"];
}

function drawLegend(target){
    var gap = 5;
    var squareSize = 20;
    var topMargin = 50;
    
    target.append('g')
        .attr('class', 'legend')
        .selectAll('g.category')
        .data(Object.keys(COLOR_SCALE))
        .enter()
        .append('g')
        .attr('class', 'category')
        .append('rect')
        .attr('x', $("#map-container").width()-100)
        .attr('y', function(d, i) {
            return (squareSize+gap) * i + topMargin;
        })
        .attr('height', squareSize)
        .attr('width', squareSize)
        .style('fill', function(d) {
           return COLOR_SCALE[d]; 
        });

    d3.selectAll('.category')
        .append('text')
        .attr("class", "legend-text")
        .attr("x", $("#map-container").width()-100 + squareSize + gap)
        .attr("y", function(d, i) {
            return (squareSize+gap) * i + squareSize/2 + topMargin;
        })
        .attr("dy",".35em")
        .text(function(d){
            return d;
        });
}
