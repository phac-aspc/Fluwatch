function renderXAxis(x, target, dur){
    if (dur == undefined)
        dur = 1000;
    
    target.selectAll(".x-axis")
      .data([null])
      .enter()
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0 " + height + ")");
     
    target.select(".x-axis")
      .transition()
      .duration(dur)
      .call(d3.axisBottom(x).tickSize(5).ticks(0));
}

function renderXGrid(x, target, dur){
    if (dur == undefined)
        dur = 1000;

    target.selectAll(".x-grid")
      .data([null])
      .enter()
      .append("g")
      .attr("class", "x-grid")
      .attr("transform", "translate(0 " + height + ")");
    
    target.select(".x-grid")
      .transition()
      .duration(dur)
      .call(d3.axisBottom(x).tickSize(-height));

    target.select(".x-grid")
      .selectAll("text")
      .attr("transform", "rotate(-50)")
      .attr("x", -9)
      .style("text-anchor", "end");
     
    target.select(".x-grid")
        .selectAll("text")
        .on("mouseover", function() {
             d3.select(this)
                .style("cursor", "pointer")
                .style("font-weight", "bold");
             
             d3.select(this.parentNode)
                .select("line")
                .style("stroke-width", "2px");
      })
        .on("mouseout", function() {
             d3.select(this)
                .style("font-weight", "normal");
             d3.select(this.parentNode)
                .select("line")
                .style("stroke-width", "0.5px");
      });        
}

function renderAnimationGrid(x , target){
    target.selectAll(".x-animation")
      .data([null])
      .enter()
      .append("g")
      .attr("class", "x-animation")
      .attr("transform", "translate(0 " + height + ")");
    
    target.select(".x-animation")
      .call(d3.axisBottom(x).tickSize(-height));
      
    target.select(".x-animation")
        .selectAll("line")
        .style("stroke", "#ccc")
        .attr("opacity", 0);
     
}

function renderYGrid(y, target, dur){
    if (dur == undefined)
        dur = 1000;

    target.selectAll(".y-grid")
      .data([null])
      .enter()
      .append("g")
      .attr("class", "y-grid");
      
    target.select(".y-grid")
      .transition()
      .duration(dur)
      .call(d3.axisLeft(y).tickSize(-width).ticks(20));
    
    target.select(".y-grid")
        .selectAll("text")
        .on("mouseover", function() {
         d3.select(this)
            .style("cursor", "pointer")
            .style("font-weight", "bold");
         d3.select(this.parentNode)
            .select("line")
            .style("stroke-width", "2px")
            .style("stroke-dasharray", "3");
      })
      .on("mouseout", function() {
         d3.select(this)
            .style("font-weight", "normal");
         d3.select(this.parentNode)
            .select("line")
            .style("stroke-width", "0.5px")
            .style("stroke-dasharray", "1");
      });
    
    target.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - MARGIN.left + 80)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("# of Hospitalizations");
}

function renderYAxis(y, target, dur){
    if (dur == undefined)
        dur = 1000;

    target.selectAll(".y-axis")
      .data([null])
      .enter()
      .append("g")
      .attr("class", "y-axis")
      .transition()
      .duration(dur)
      .call(d3.axisLeft(y).tickSize(0).ticks(0));
}

function drawAxis(y, x, dur) {
    if (dur == undefined)
        dur = 1000;

    var svg = d3.select('#container');
    
    y.range([height, 0]);
    
    renderXGrid(x, svg, dur);
    renderXAxis(x, svg, dur);
    
    renderYGrid(y, svg, dur);
    renderYAxis(y, svg, dur);
    
    y.range([0, height]);
}

function drawAreaChart(data, y, x, target, dur) {
    if (dur == undefined)
        dur = 1000;

   // bind data to g elements
   // each g is going to represent a stack on the area graph
   var binding = target
      .selectAll("g.path")
      .data(data);
    
   // entering the data and drawing the stacked shapes
   binding.enter()
      .append("g")
      .attr("class", "path")
      .style("transform", "translate(1px)")
      .attr("id", function(d) { return d.key; })
      .attr("fill", function(d) {
         return CATEGORIES[d.key];
      })
      .append("path")
      .attr("d",
         d3.area()
         .x(function(d) {
            return x(d["data"]["startDate"] + "-" + d["data"]["endDate"]+ ", " + d["data"]["year"]);
         })
         .y1(height)
         .y0(height)
      )
      .transition()
      .duration(dur)
      .attr("d",
         d3.area()
         .x(function(d) { return x(d["data"]["startDate"] + "-" + d["data"]["endDate"]+ ", " + d["data"]["year"]); })
         .y1(function(d) {
            return height - y(d[1]);
         })
         .y0(function(d) {
            return height - y(d[0]);
         })
      );

   binding.select("path")
      .transition()
      .duration(dur)
      .attrTween("d", function(d) {
               var prevD = d3.select(this).attr("d");

               var newD = d3.area()
                              .x(function(d) { return x(d["data"]["startDate"] + "-" + d["data"]["endDate"]+ ", " + d["data"]["year"]); })
                              .y1(function(d) {
                                 return height - y(d[1]);
                              })
                              .y0(function(d) {
                                 return height - y(d[0]);
                              });

               return d3.interpolatePath(prevD, newD(d));
            });
    drawAxis(y, x);
}