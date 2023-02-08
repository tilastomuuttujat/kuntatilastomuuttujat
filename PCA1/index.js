var margin = {top: 20, right: 20, bottom: 20, left: 20};
var width = 500 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
var angle = Math.PI * 0;
var color = d3.scale.category10();

var x = d3.scale.linear().range([width, 0]); // switch to match how R biplot shows it
var y = d3.scale.linear().range([height, 0]);

x.domain([-3.5,3.5]).nice()
y.domain([-3.5,3.5]).nice()

var data = [{"ATTRIBUTE":"Early/First line","Z":0.05,"A":0.17,"X":0,"GENERIC":0,"Y":0,"B":0},{"ATTRIBUTE":"Refractory/late-line","Z":0.32,"A":0.29,"X":0.13,"GENERIC":0.03,"Y":0.03,"B":0.04},{"ATTRIBUTE":"General use","Z":0.18,"A":0.24,"X":0.13,"GENERIC":0.2,"Y":0.15,"B":0.28},{"ATTRIBUTE":"Convenient","Z":0.12,"A":0,"X":0,"GENERIC":0,"Y":0,"B":0},{"ATTRIBUTE":"Unfamiliar","Z":0.13,"A":0.02,"X":0,"GENERIC":0,"Y":0,"B":0},{"ATTRIBUTE":"Non-compliant","Z":0.12,"A":0,"X":0.03,"GENERIC":0.04,"Y":0.23,"B":0.06},{"ATTRIBUTE":"Physical symptoms","Z":0,"A":0.03,"X":0,"GENERIC":0.14,"Y":0.11,"B":0.03},{"ATTRIBUTE":"Cognitive symptoms","Z":0.01,"A":0,"X":0.02,"GENERIC":0.33,"Y":0.02,"B":0.02}] 


var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



//d3.csv(csv_url, function(error, data) {


  var matrix = data.map(function(d){
    return d3.values(d).slice(1,d.length).map(parseFloat);
  });

  var pca = new PCA();
  matrix = pca.scale(matrix,true,true);

  pc = pca.pca(matrix,2)

  var A = pc[0];  // this is the U matrix from SVD
  var B = pc[1];  // this is the dV matrix from SVD

  var brand_names = Object.keys(data[0]);  // first row of data file ["ATTRIBUTE", "BRAND A", "BRAND B", "BRAND C", ...]
  brand_names.shift(); // drop the first column label, e.g. "ATTRIBUTE"

  data.map(function(d,i){
    label: d.ATTRIBUTE,
        d.pc1 = A[i][0];
    d.pc2 = A[i][1];
  });

  var label_offset = {
    "Early/First line": 20,
    "Unfamiliar":10,
    "Convenient": -5
  }

  var brands = brand_names
      .map(function(key, i) {
        return {
          brand: key,
          pc1: B[i][0]*4,
          pc2: B[i][1]*4
        }
      });


  function rotate(x,y, dtheta) {

    var r = Math.sqrt(x*x + y*y);
    var theta = Math.atan(y/x);
    if (x<0) theta += Math.PI;

    return {
      x: r * Math.cos(theta + dtheta),
      y: r * Math.sin(theta + dtheta)
    }
  }


  data.map(function(d) {
    var xy = rotate(d.pc1, d.pc2, angle);
    d.pc1 = xy.x;
    d.pc2 = xy.y;
  });

  brands.map(function(d) {
    var xy = rotate(d.pc1, d.pc2, angle);
    d.pc1 = xy.x;
    d.pc2 = xy.y;
  });


  var showAxis = false;  // normally we don't want to see the axis in PCA, it's meaningless
  if (showAxis) {
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("PC1");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("PC2");
  }

  var legend = svg.selectAll(".legend")
      .data(color.domain())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });

  svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return x(d.pc1); })
      .attr("cy", function(d) { return y(d.pc2); })
      .style("fill", function(d) { return color(d['species']); })
      .on('mouseover', onMouseOverAttribute)
      .on('mouseleave', onMouseLeave);



  svg.selectAll("circle.brand")
      .data(brands)
      .enter().append("circle")
      .attr("class", "square")
      .attr("r", 7)
      .attr("cx", function(d) { return x(d.pc1); })
      .attr("cy", function(d) { return y(d.pc2); })
      .style("fill", function(d) { return color(d['brand']); })
      .on('mouseover', onMouseOverBrand)
      .on('mouseleave', onMouseLeave);


  svg.selectAll("text.brand")
      .data(brands)
      .enter().append("text")
      .attr("class", "label-brand")
      .attr("x", function(d) { return x(d.pc1) + 10; })
      .attr("y", function(d) { return y(d.pc2) + 0; })
      .text(function(d) { return d['brand']})


  svg.selectAll(".line")
      .data(brands)
      .enter().append("line")
      .attr("class", "square")
      .attr('x1', function(d) { return x(-d.pc1);})
      .attr('y1', function(d) { return y(-d.pc2); })
      .attr("x2", function(d) { return x(d.pc1); })
      .attr("y2", function(d) { return y(d.pc2); })
      .style("stroke", function(d) { return color(d['brand']); })
      .on('mouseover', onMouseOverBrand)
      .on('mouseleave', onMouseLeave);



  svg.selectAll("text.attr")
      .data(data)
      .enter().append("text")
      .attr("class", "label-attr")
      .attr("x", function(d,i ) { return x(d.pc1)+4 ; })
      .attr("y", function(d ,i) { return y(d.pc2) + (label_offset[d.ATTRIBUTE]||0); })
      .text(function(d,i) { return d.ATTRIBUTE})

  var pctFmt = d3.format('0%')
  var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([10, 20])
      .direction('e')
      .html(function(values,title) {
        var str =''
        str += '<h3>' + (title.length==1 ? 'Brand ' : '' )+ title  + '</h3>'
        str += "<table>";
        for (var i=0; i<values.length; i++) {
          if (values[i].key != 'ATTRIBUTE' && values[i].key != 'pc1' && values[i].key != 'pc2') {
            str += "<tr>";
            str += "<td>" + values[i].key + "</td>";
            str += "<td class=pct>" + pctFmt(values[i].value) + "</td>";
            str + "</tr>";
          }
        }
        str += "</table>";

        return str;
      });

  svg.call(tip);

  function getSpPoint(A,B,C){
    var x1=A.x, y1=A.y, x2=B.x, y2=B.y, x3=C.x, y3=C.y;
    var px = x2-x1, py = y2-y1, dAB = px*px + py*py;
    var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    var x = x1 + u * px, y = y1 + u * py;
    return {x:x, y:y}; //this is D
  }


// draw line from the attribute a perpendicular to each brand b
  function onMouseOverAttribute(a,j) {

    brands.forEach(function(b, idx) {
      var A = { x: 0, y:0 };
      var B = { x: b.pc1,  y: b.pc2 };
      var C = { x: a.pc1,  y: a.pc2 };

      b.D = getSpPoint(A,B,C);
    });

    svg.selectAll('.tracer')
        .data(brands)
        .enter()
        .append('line')
        .attr('class', 'tracer')
        .attr('x1', function(b,i) { return x(a.pc1); return x1; })
        .attr('y1', function(b,i) { return y(a.pc2); return y1; })
        .attr('x2', function(b,i) { return x(b.D.x); return x2; })
        .attr('y2', function(b,i) { return y(b.D.y); return y2; })
        .style("stroke", function(d) { return "#aaa"});

    delete a.D;
    var tipText = d3.entries(a);
    tip.show(tipText, a.ATTRIBUTE);
  };

// draw line from the brand axis a perpendicular to each attribute b
  function onMouseOverBrand(b,j) {

    data.forEach(function(a, idx) {
      var A = { x: 0, y:0 };
      var B = { x: b.pc1,  y: b.pc2 };
      var C = { x: a.pc1,  y: a.pc2 };

      a.D = getSpPoint(A,B,C);
    });

    svg.selectAll('.tracer')
        .data(data)
        .enter()
        .append('line')
        .attr('class', 'tracer')
        .attr('x1', function(a,i) { return x(a.D.x);  })
        .attr('y1', function(a,i) { return y(a.D.y);  })
        .attr('x2', function(a,i) { return x(a.pc1);  })
        .attr('y2', function(a,i) { return y(a.pc2); })
        .style("stroke", function(d) { return "#aaa"});

    var tipText = data.map(function(d) {
      return {key: d.ATTRIBUTE, value: d[b['brand']] }
    })
    tip.show(tipText, b.brand);
  };

  function onMouseLeave(b,j) {
    svg.selectAll('.tracer').remove()
    tip.hide();
  }

//});
