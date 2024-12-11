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
  const margin = { top: 20, right: 150, bottom: 70, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

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
  const updateChart = (selectedCategory, highlightedSubgroup) => {
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
  updateChart(categories[0], "None");

  // Add event listeners for dropdowns
  categoryFilter.on("change", (event) => {
    const selectedCategory = event.target.value;
    updateSubgroupDropdown(selectedCategory);
    const highlightedSubgroup = subgroupFilter.node().value;
    updateChart(selectedCategory, highlightedSubgroup);
  });

  subgroupFilter.on("change", (event) => {
    const highlightedSubgroup = event.target.value;
    const selectedCategory = categoryFilter.node().value;
    updateChart(selectedCategory, highlightedSubgroup);
  });
}).catch((error) => console.error("Error loading data:", error));
