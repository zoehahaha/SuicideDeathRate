// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 1000 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var treemap = d3.tree().size([height, width]);

var svg = d3.select("#tree").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load the hierarchy data
d3.json("hierarchy_data.json").then(function(treeData) {
  root = d3.hierarchy(treeData, function(d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  // Initially collapse all nodes beyond the root
  if (root.children) {
    root.children.forEach(collapse);
  }
  
  update(root);

  // Attach event listener to collapse button
  d3.select("#collapse-button").on("click", function() {
    if (root.children) {
      root.children.forEach(collapse);
    }
    update(root);
  });
});

function update(source) {
  var treeData = treemap(root);
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Set positions
  nodes.forEach(function(d){ d.y = d.depth * 180; });

  // Nodes
  var node = g.selectAll('g.node')
    .data(nodes, function(d) {return d.id || (d.id = ++i); });

  // Enter new nodes at parent's old position
  var nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr("transform", function(d) {
       return "translate(" + source.y0 + "," + source.x0 + ")";
    })
    .on('click', click);

  // Add circles
  nodeEnter.append('circle')
    .attr('class', 'node')
    .attr('r', 6) // Reduced circle size
    .style("fill", function(d) {
       return d._children ? "lightsteelblue" : "#fff";
    });

  // Add text labels with adjusted font size
  nodeEnter.append('text')
    .style("font-size", "12px") // Adjusted font size
    .attr("dy", ".35em")
    .attr("x", function(d) {
       return d.children || d._children ? -10 : 10;
    })
    .attr("text-anchor", function(d) {
       return d.children || d._children ? "end" : "start";
    })
    .text(function(d) { return d.data.name; });

  var nodeUpdate = nodeEnter.merge(node);

  // Transition new and updated nodes
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) { 
       return "translate(" + d.y + "," + d.x + ")";
    });

  nodeUpdate.select('circle.node')
    .attr('r', 6) // Adjusted circle size
    .style("fill", function(d) {
       return d._children ? "lightsteelblue" : "#fff";
    })
    .attr('cursor', 'pointer');

  // Remove exiting nodes
  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) {
       return "translate(" + source.y + "," + source.x + ")";
    })
    .remove();

  nodeExit.select('circle')
    .attr('r', 1e-6);
  
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // Links (adjust thickness for better visualization)
  var link = g.selectAll('path.link')
    .data(links, function(d) { return d.id; });

  // Enter new links at parent's old position
  var linkEnter = link.enter().insert('path', "g")
    .attr("class", "link")
    .attr('d', function(d){
       var o = {x: source.x0, y: source.y0};
       return diagonal(o, o);
    })
    .style("fill", "none") // Ensure links are not filled
    .style("stroke", "#ccc") // Adjust stroke color
    .style("stroke-width", 1.5); // Thinner stroke width

  var linkUpdate = linkEnter.merge(link);

  // Transition links to new positions
  linkUpdate.transition()
    .duration(duration)
    .attr('d', function(d){ return diagonal(d.parent, d); });

  // Remove exiting links
  var linkExit = link.exit().transition()
    .duration(duration)
    .attr('d', function(d) {
       var o = {x: source.x, y: source.y};
       return diagonal(o, o);
    })
    .remove();

  // Store old positions for transition
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Diagonal function for links
function diagonal(s, d) {
  var path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;
  return path;
}

// Toggle children on click
function click(event, d) {
  if (d.children) {
     d._children = d.children;
     d.children = null;
  } else {
     d.children = d._children;
     d._children = null;
  }
  update(d);
}

// Collapse function
function collapse(d) {
  if(d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}










// Time Series
// Load the data from the CSV file
d3.csv("Clean.csv").then((data) => {
  if (!data || data.length === 0) {
    console.error("Data is empty or failed to load!");
    return;
  }

  // Parse and clean data
  const parseTime = d3.timeParse("%Y");
  data.forEach((d) => {
    d.TIME_PERIOD = parseTime(d.TIME_PERIOD);
    d.ESTIMATE = +d.ESTIMATE;
  });

  // Get unique categories for dropdown menus
  const categories = [...new Set(data.map((d) => d.Category))];

  // Set up SVG dimensions and margins
  const margin = { top: 60, right: 150, bottom: 70, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Add a title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -30) // Adjusted for space above the chart
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Interactive Suicide Rate Trends by Subgroup");

  // Tooltip div
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "5px 10px")
    .style("border-radius", "5px")
    .style("display", "none");

  // Define scales and axes
  const xScale = d3.scaleTime().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  // Append axes
  svg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`);
  svg.append("g").attr("class", "y-axis");

  // Add axis labels
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .text("Year");

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -50)
    .text("Suicide Rate (per 100,000)");

  // Add dropdown menus
  const categoryFilter = d3.select("#category-filter");
  const subgroupFilter = d3.select("#subgroup-filter");

  categoryFilter
    .selectAll("option")
    .data(categories)
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);

  // Color scale for subgroups
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Function to update subgroup dropdown
  const updateSubgroupDropdown = (selectedCategory) => {
    const filteredData = data.filter((d) => d.Category === selectedCategory);
    const subgroups = [...new Set(filteredData.map((d) => d.SUBGROUP))];

    // Clear the existing options
    subgroupFilter.selectAll("option").remove();

    // Add new options for the filtered subgroups
    subgroupFilter
      .selectAll("option")
      .data(["None", ...subgroups])
      .enter()
      .append("option")
      .text((d) => d)
      .attr("value", (d) => d);
  };

  // Function to update the chart
  const updateChart = (selectedCategory, highlightedSubgroup, animate = false) => {
    const filteredData = data.filter((d) => d.Category === selectedCategory);
    const subgroups = [...new Set(filteredData.map((d) => d.SUBGROUP))];

    // Update scales
    xScale.domain(d3.extent(filteredData, (d) => d.TIME_PERIOD));
    yScale.domain([0, d3.max(filteredData, (d) => d.ESTIMATE)]);

    // Update axes
    svg.select(".x-axis").call(xAxis);
    svg.select(".y-axis").call(yAxis);

    // Bind data to lines
    const lines = svg.selectAll(".line").data(
      d3.groups(filteredData, (d) => d.SUBGROUP),
      (d) => d[0]
    );

    // Enter new lines
    lines
      .enter()
      .append("path")
      .attr("class", "line")
      .merge(lines)
      .attr("fill", "none")
      .attr("stroke", (d) => colorScale(d[0]))
      .attr("stroke-width", (d) => (d[0] === highlightedSubgroup ? 3 : 1.5))
      .attr("d", (d) =>
        d3
          .line()
          .x((d) => xScale(d.TIME_PERIOD))
          .y(() => (animate ? yScale(0) : yScale(d.ESTIMATE)))(d[1])
      )
      .transition()
      .duration(animate ? 1000 : 0)
      .attr("d", (d) =>
        d3
          .line()
          .x((d) => xScale(d.TIME_PERIOD))
          .y((d) => yScale(d.ESTIMATE))(d[1])
      );

    lines.exit().remove();

    // Add points only for highlighted subgroup
    const points = svg.selectAll(".point").data(
      highlightedSubgroup !== "None"
        ? filteredData.filter((d) => d.SUBGROUP === highlightedSubgroup)
        : []
    );

    points
      .enter()
      .append("circle")
      .attr("class", "point")
      .merge(points)
      .attr("r", 5)
      .attr("cx", (d) => xScale(d.TIME_PERIOD))
      .attr("cy", (d) => yScale(d.ESTIMATE))
      .attr("fill", "orange")
      .on("mouseover", function (event, d) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`)
          .style("display", "inline-block")
          .html(
            `Subgroup: ${d.SUBGROUP}<br>Year: ${d3.timeFormat("%Y")(d.TIME_PERIOD)}<br>Value: ${d.ESTIMATE}`
          );
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
      });

    points.exit().remove();

    // Update legend
    const legend = svg
      .selectAll(".legend")
      .data(subgroups, (d) => d);

    const legendEnter = legend.enter().append("g").attr("class", "legend");

    legendEnter
      .append("circle")
      .attr("cx", width + 20)
      .attr("cy", (_, i) => i * 25 + 10)
      .attr("r", 6)
      .attr("fill", (d) => colorScale(d));

    legendEnter
      .append("text")
      .attr("x", width + 35)
      .attr("y", (_, i) => i * 25 + 15)
      .style("font-size", "12px")
      .text((d) => d);

    legend.exit().remove();
  };

  // Initialize chart with default values
  updateSubgroupDropdown(categories[0]);
  updateChart(categories[0], "None", true);

  // Add event listeners for dropdowns
  categoryFilter.on("change", (event) => {
    const selectedCategory = event.target.value;
    updateSubgroupDropdown(selectedCategory);
    updateChart(selectedCategory, "None", true); // Animate when category changes
  });

  subgroupFilter.on("change", (event) => {
    const highlightedSubgroup = event.target.value;
    const selectedCategory = categoryFilter.node().value;
    updateChart(selectedCategory, highlightedSubgroup, false); // No animation for subgroup changes
  });
}).catch((error) => console.error("Error loading data:", error));