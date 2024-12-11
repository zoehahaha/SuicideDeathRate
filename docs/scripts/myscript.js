// Sample dataset (replace with your actual data)
const data = [
  { year: 2000, value: 10.5, subgroup: "White", filter: "race" },
  { year: 2001, value: 10.7, subgroup: "White", filter: "race" },
  { year: 2000, value: 12.0, subgroup: "Black", filter: "race" },
  { year: 2002, value: 8, subgroup: "Black", filter: "race" },
  { year: 2003, value: 7, subgroup: "Black", filter: "race" },
  { year: 2004, value: 15, subgroup: "Black", filter: "race" },
  { year: 2005, value: 6, subgroup: "Black", filter: "race" },
  // Add more data here
];

// Set up margins and dimensions
const margin = { top: 20, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3
  .select("#plot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Axes
const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
const yAxis = d3.axisLeft(yScale);

// Append axes to the SVG
svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
svg.append("g").attr("class", "y-axis");

// Tooltip
const tooltip = d3.select("#tooltip");

// Function to update the plot
function updatePlot(filterBy) {
  // Filter data
  const filteredData = data.filter((d) => d.filter === filterBy);

  // Group data by subgroup
  const groupedData = d3.group(filteredData, (d) => d.subgroup);

  // Set domains
  xScale.domain(d3.extent(filteredData, (d) => d.year));
  yScale.domain([0, d3.max(filteredData, (d) => d.value)]);

  // Update axes
  svg.select(".x-axis").transition().call(xAxis);
  svg.select(".y-axis").transition().call(yAxis);

  // Bind data to lines
  const lines = svg.selectAll(".line").data([...groupedData.entries()]);

  // Enter
  lines
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", (d) => colorScale(d[0]))
    .attr("stroke-width", 2)
    .attr("d", (d) =>
      d3
        .line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value))(d[1])
    )
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 10}px`)
        .html(`<strong>Subgroup:</strong> ${d[0]}<br>`);
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  // Update
  lines
    .transition()
    .attr("stroke", (d) => colorScale(d[0]))
    .attr("d", (d) =>
      d3
        .line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value))(d[1])
    );

  // Exit
  lines.exit().remove();
}

// Event listener for dropdown
d3.select("#filter").on("change", function () {
  const filterBy = d3.select(this).property("value");
  updatePlot(filterBy);
});

// Initial render
updatePlot("race");
