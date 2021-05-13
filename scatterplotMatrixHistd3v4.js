var width = 960,
    size = 150,
    padding = 19.5;

var a = [];

var x = d3.scaleLinear()
    .range([padding / 2, size - padding / 2]);

var y = d3.scaleLinear()
    .range([size - padding / 2, padding / 2]);

var histX = d3.scaleLinear()
    .range([padding / 2, size - padding / 2]);

var histY = d3.scaleLinear()
    .range([size - padding / 2, padding / 2]);

var formatSiPrefix = d3.format("3,.1s") ;

var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(5)
    .tickFormat(formatSiPrefix);

var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(5)
    .tickFormat(formatSiPrefix);

var color = d3.scaleOrdinal(d3.schemeCategory10);

// Establish the resource filtering buttons
categories = [  "BIOMASS",
                "COAL",
                "GAS",
                "GEOTHERMAL",
                "HYDRO",
                "NUCLEAR",
                "OIL",
                "OTHER",
                "SOLAR",
                "WIND" ] ;
d3Colors = d3.scaleOrdinal(d3.schemeCategory20)
              .domain(d3.range(1,21)) ;
categoryColors = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19] ;
categoryLabels = [ "bio", "coal", "gas", "geo", "hydro", "nuc", "oil", "other", "solar", "wind"] ;
categoryLabelColors = ["white","white","white","white","white","white","white","white","white","white"] ;
categoryColorIndex = {BIOMASS:1,
                COAL:3,
                GAS:5,
                GEOTHERMAL:7,
                HYDRO:9,
                NUCLEAR:11,
                OIL:13,
                OTHER:15,
                SOLAR:17,
                WIND:19 } ;
categoryState = {BIOMASS:true,
                COAL:true,
                GAS:true,
                GEOTHERMAL:true,
                HYDRO:true,
                NUCLEAR:true,
                OIL:true,
                OTHER:true,
                SOLAR:true,
                WIND:true } ;
diagonalNames = {co2emissionsRate: "CO2e Rate [tons/MWh]",
                 co2emissions: "CO2e [tons]",
                 capacityfactor: "Capacity Factor",
                 generation: "Energy [MWh]",
                 nameplate: "Capacity [MW]",
                 age: "Age [yrs]"
                 } ;
// Legend data buttons

// Legend variables
var dEdge = -50 ;
var radius = 15 ;

var filterType = ["none","none"] ;
var filterLimits = [[0,0],[0,0]] ;

//----------------------------------------
// Load and plot the data 
//----------------------------------------
d3.csv("egrid2010_scatterplot.csv", function(error, data) {
  if (error) throw error;
  var allData = data ;
  data = data.filter(function(d){
    if (d.generation >= 296256) { // Limit data to 95% of generation
      return true ;
    } else {
      return false ;
    }
  });

  // Determine the types of each plot by extracting the first line of the csv and ignoring
  //  "species"
  var domainByTrait = {},
      traits = d3.keys(data[0]).filter(function(d) { return (d !== "fuel" && d!=="age"); }),
      n = traits.length;

  // Get Min and Max of each of the columns
  traits.forEach(function(trait) {
    domainByTrait[trait] = d3.extent(data, function(d) {
      return +d[trait];
    });
  });

  // Set the ticks to stretch across all plots
  xAxis.tickSize(size * n);
  yAxis.tickSize(-size * n);  // negative so ticks go right

  // Create brishing variable
  var brush = d3.brush()
      .on("start", brushstart)
      .on("brush", brushmove)
      .on("end", brushend)
      .extent([[0,0],[size,size]]);

  // Create the svg box
  var svg = d3.select("div#d3container").append("svg")
      .attr("width", size * n + padding*5)
      .attr("height", size * n + padding)
      .append("g")
      .attr("transform", "translate(" + padding*4 + "," + padding / 2 + ")");

  //------------------------------------
  // Create Legend
  //------------------------------------

  // Create the legend group
  var gLegend = svg.append("g");
/*
  // Creat the legend
  legendDataButtons = gLegend.selectAll("circle.dataSwitch")
        .data(categories)
        .enter() ;
  legendDataButtons.append("circle")
          .classed("dataSwitch", true)
          .attr("cx", dEdge)
          .attr("cy", function(d,i) {
            return (2*radius + 3)*(i + 1) ;
          })
          .attr('r', radius)
          .attr("fill", function(d,i) {
            return d3Colors(categoryColors[i]) ;
          })
          .attr("stroke", "black")
          .attr("stroke-width", 1.5)
          .attr("isVisible",true)
          .on("click", switchVisibility) ;
  legendDataButtons.append("text")
          .attr({ x:dEdge,
            y:function(d,i) {
              return (2*radius + 3)*(i + 1) ;
            },
            "font-size":8,
            "font-family":"Verdana",
            "text-anchor":"middle",
            fill: function(d,i) {
              return categoryLabelColors[i] ;
            },
            "alignment-baseline":"middle"})
    .style('pointer-events', 'none')
    .style("-webkit-user-select", "none") // This must be expanded to prevent selections in other browsers
    .text(function(d,i) {
      return categoryLabels[i] ;
    });
*/

  // Create each x-axis
  svg.selectAll(".x.axis")
      .data(traits)
    .enter().append("g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
      .each(function(d) {
        x.domain(domainByTrait[d]);
        d3.select(this).call(xAxis);
      });

  // Create each y-axis
  svg.selectAll(".y.axis")
      .data(traits)
    .enter().append("g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) {
        return "translate(0," + i * size + ")";
      })
      .each(function(d) {
        y.domain(domainByTrait[d]);
        d3.select(this).call(yAxis);
      });

  var cell = svg.selectAll(".cell")
      .data(cross(traits, traits))
      .enter().append("g")
      .attr("class", "cell") ;

  var plotCells = cell.filter(function(d) { return d.i !== d.j; })
      .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
      .each(plot);

  var histCells = cell.filter(function(d) { return d.i === d.j; })
      .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
      .each(firstPlotHistogram) ;

  // Run the brush
  plotCells.call(brush);

  //------------------------------------------
  // Plot Scatterplot Point
  //------------------------------------------
  function plot(p) {
    var cell = d3.select(this);

    histX.domain(domainByTrait[p.x]);
    histY.domain(domainByTrait[p.y]);

    cell.append("rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    cell.selectAll("circle.data")
        .data(data)
        .enter().append("circle")
        .classed("data",true)
        .attr("cx", function(d) {
          // For each data point, return the appropriate x and 
          //  y value corresponding to the pair of data, and scale it
          return histX(d[p.x]);
        })
        .attr("cy", function(d) { return histY(d[p.y]); })
        .attr("r", 2)
        .style("fill", function(d) {
          return d3Colors(categoryColorIndex[d.fuel]);
        });
  }

  //------------------------------------------
  // Update Histogram
  //------------------------------------------
  function updateHistograms() {
    d3.selectAll(".histogram")
      .remove() ;

    histCells.each(function(p) {

      var cell = d3.select(this);

      histX.domain(domainByTrait[p.x]);
      
histY.domain(domainByTrait[p.y]);
      //y.domain(domainByTrait[p.y]);

      // Filter data down based on selections
      var histData = data.filter(function(d) {
        
        // Has the fuel category been hidden?
        if (!categoryState[d.fuel]) {
            return false ;
        // Is a filter applied and is the point within the bounds of the selected region
        } else if (filterType[0] !== "none") {
           if (filterLimits[0][0] > +d[filterType[0]] || +d[filterType[0]] > filterLimits[0][1] ||
               filterLimits[1][0] > +d[filterType[1]] || +d[filterType[1]] > filterLimits[1][1]) {
            return false ;
           }
        }
        return true ;
      }) ;

      // Extract data for histogramming into single array
      histData = histData.map(function(d) {
        return +d[p.x] ;
      });

      // Generate a histogram using twenty uniformly-spaced bins.
      var hist = d3.histogram()
        .thresholds(histX.ticks(20))
        (histData);

      var histScale = d3.scaleLinear()
      .domain([0, d3.max(hist, function(d) { return d.length; })])
      .range([size - padding / 2, padding / 2]);

      var bar = cell.selectAll(".bar")
        .data(hist)
        .enter().append("g")
        .attr("class", "bar")
        .classed("histogram",true)
        .attr("transform", function(d) {
          return "translate(" + histX(d.x0) + "," + histScale(d.length) + ")";
        });

      bar.append("rect")
      .classed("histogram",true)
      .attr("x", 1)
      .attr("width", 5) //x(hist[0].dx) )
      .attr("height", function(d) {
        return size - padding / 2 - histScale(d.length);
      });

      // Titles for the diagonal.
      //cell.filter(function(d) { return d.i === d.j; }).
      cell.append("text")
      .classed("histogram",true)
      .attr("x", size - padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .attr("text-anchor","end")
      .text(function(d) { return diagonalNames[d.x]; });
    }) ;
  }

  //------------------------------------------
  // First Plot Histogram
  //------------------------------------------
  function firstPlotHistogram(p) {

    var cell = d3.select(this);

    histX.domain(domainByTrait[p.x]);
    histY.domain(domainByTrait[p.y]);

    cell.append("rect")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding)
        .attr("fill", "white")
        .attr("stroke","#aaa");

    // Extract data for histogramming into single array
    histData = data.map(function(d) {
      return +d[p.x] ;
    });

    // Generate a histogram using twenty uniformly-spaced bins.
    var hist = d3.histogram()
      .thresholds(histX.ticks(20))
      (histData);

    var histScale = d3.scaleLinear()
    .domain([0, d3.max(hist, function(d) { return d.length; })])
    .range([size - padding / 2, padding / 2]);

    var bar = cell.selectAll(".bar")
      .data(hist)
      .enter().append("g")
      .attr("class", "bar")
      .classed("histogram",true)
      .attr("transform", function(d) {
        return "translate(" + histX(d.x0) + "," + histScale(d.length) + ")";
      });

    bar.append("rect")
    .classed("histogram",true)
    .attr("x", 1)
    .attr("width", 5) //x(hist[0].dx) )
    .attr("height", function(d) {
      return size - padding / 2 - histScale(d.length);
    });

    // Titles for the diagonal.
    //cell.filter(function(d) { return d.i === d.j; }).
    cell.append("text")
    .classed("histogram",true)
    .attr("x", size - padding)
    .attr("y", padding)
    .attr("dy", ".71em")
    .attr("text-anchor","end")
    .text(function(d) { return diagonalNames[d.x]; });
  }

  var brushCell;

  //------------------------------------------
  // Brushstart
  //------------------------------------------
  // Clear the previously-active brush, if any.
  /*
  function brushstart(p) {
    if (brushCell !== this) {
      d3.select(brushCell).call(brush.clear());
      x.domain(domainByTrait[p.x]);
      y.domain(domainByTrait[p.y]);
      brushCell = this;
      console.log("clear");
    }
*/
function brushstart(p) {
    if (brushCell !== this) {
      d3.select(brushCell).call(brush.move, null);
      brushCell = this;
    x.domain(domainByTrait[p.x]);
    y.domain(domainByTrait[p.y]);
    }
  


    // Reset histogram parameters
    //filterType = ["none","none"] ;
    //filterLimits = [[0,0],[0,0]] ;
    //updateHistograms() ;
    //console.log("start");
  }

  //------------------------------------------
  // Brushmove
  //------------------------------------------
  // Highlight the selected circles.
  function brushmove(p) {
  
    //var e = brush.extent();
var e = d3.brushSelection(this);

console.log(e);
if (e===null) e = a;
a = e;
console.log(e);
    // Identify subselections for histograms
    filterType = [p.x,p.y] ;
    filterLimits = [ [+e[0][0],+e[1][0]],
                     [+e[0][1],+e[1][1]]
                   ] ;
    if (filterLimits[0][0] == filterLimits[0][1] && filterLimits[1][0] == filterLimits[1][1]) {
      filterType = ["none","none"] ;
      updateHistograms() ;
    }

    svg.selectAll("circle.data").classed("hidden", function(d) {
      return +e[0][0] > +d[p.x] || +d[p.x] > +e[1][0] ||
             +e[0][1] > +d[p.y] || +d[p.y] > +e[1][1];

    });
    updateHistograms() ;
    
  }

/*
function brushmove(p) {
    var e = d3.brushSelection(this);
    svg.selectAll("circle").classed("hidden", function(d) {
      return !e
        ? false
        : (
          e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
          || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
        );
    });
    updateHistograms() ;
  }
*/

  //------------------------------------------
  // Brushend
  //------------------------------------------
  // If the brush is empty, select all circles.
  function brushend() {
    var e = d3.brushSelection(this);
    if (e === null) svg.selectAll(".hidden").classed("hidden", false);
    updateHistograms() ;
  }
  
/*
  function brushend() {
    if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
    updateHistograms() ;
  }
*/
  //------------------------------------------
  // Cross
  //------------------------------------------
  function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;)
      for (j = -1; ++j < m;)
        c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }

  d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");

//------------------------------------------
// Switchvisibility
//------------------------------------------
// Switch the visibility of generators based on side buttons
function switchVisibility(d,i) {
  var selection = svg.selectAll("circle.data")
                   .filter(function(data,index) {
                      return data.fuel === categories[i] ;
                   }) ;
  if (d3.select(this).attr("isVisible") === "true") {
    selection.attr("visibility","hidden") ;

    // Fade the button
    d3.select(this)
      .attr("fill", function() {
        return d3Colors(categoryColors[i] + 1) ;
      })
      .attr("isVisible",false) ;

      // Remove the data from consideration in histograms
      categoryState[categories[i]] = false ;
  } else {
    selection.attr("visibility","visible") ;

    // Darken the button
    d3.select(this)
      .attr("fill", function() {
        return d3Colors(categoryColors[i]) ;
    })
    .attr("isVisible",true ) ;

    // Add the data to histograms
      categoryState[categories[i]] = true ;
  }
  updateHistograms();
}
});