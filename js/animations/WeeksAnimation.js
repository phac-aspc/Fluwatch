function WeeksAnimation(data, weeks, time) {
    if (time == undefined)
        this.timer = 2000;
    else
        this.timer = time;

    this.index = 0;
    this.interval = null;
    this.data = data;
    this.weeks = weeks;
    this.paused = true;
}

WeeksAnimation.prototype.play = function(){
    var _this = this;
    this.paused = false;
    this.interval = setInterval(function(){
        
        colorMap(_this.data, _this.weeks[_this.index]);
        _this.highlightGraph();
            
        $("weekSelected").textContent = _this.weeks[_this.index];
            
        _this.index = _this.index+1 == _this.weeks.length ? 0 : _this.index+1;
    }, this.timer);
        
    d3.select("#play-pause")
    .select("i")
    .attr("class", "fas fa-pause");
};

WeeksAnimation.prototype.stop = function(){
    this.paused = true;
    clearInterval(this.interval);
    d3.select("#play-pause")
        .select("i")
        .attr("class", "fas fa-play");
};

WeeksAnimation.prototype.restart = function(){
    this.index = 0;
    this.highlightGraph();
    colorMap(this.data, this.weeks[this.index]);
};

WeeksAnimation.prototype.highlightGraph = function(){
    var _this = this;
    var grid = d3.select('.x-animation');

    document.getElementById("weeksRange").value = _this.index;

    grid.selectAll('line')
        .attr("opacity", 0)
        .style("stroke-width", "1px")
        .style("stroke-dasharray", "1");
        
    var pos = grid.select(".tick:nth-child("+ (_this.index+2) +")");
        
    pos.select('line')
        .attr("opacity", "1")
        .style("stroke-width", "10px")
        .style("stroke-dasharray", "0");
};
