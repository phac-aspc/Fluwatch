Array.prototype.cloneObjects = function() {
   var copy = [];

   for (var i in this) {
      copy[i] = Object.assign({}, this[i]);
   }

   return copy;
};

function isolateCategory(data, category) {
   if (category == undefined)
    category = "all";

   var clonedData = data.cloneObjects();

   if (category != "all") {
      for (var i=0;i<Object.keys(CATEGORIES).length;i++) {
         if (Object.keys(CATEGORIES)[i] != category)
            clonedData.forEach(function(el) { el[Object.keys(CATEGORIES)[i]] = 0 });
      }
   }
   return clonedData;
}

function extractWeeks(data) {
   var weeks = [];

   for (var i=0;i<data.length;i++)
      weeks.push(data[i]["startDate"] + "-" + data[i]["endDate"] + ", " + data[i]["year"]);
   
   return weeks;
}
