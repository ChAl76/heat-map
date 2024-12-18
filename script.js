document.addEventListener('DOMContentLoaded', () => {
  const dataURL =
    'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
  const margin = { top: 60, right: 100, bottom: 100, left: 100 };
  const width = 1300 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const svg = d3
    .select('body')
    .append('svg')
    .attr('id', 'svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('class', 'graph')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Tooltip
  const tooltip = d3
    .select('body')
    .append('div')
    .attr('id', 'tooltip')
    .style('opacity', 0);

  // Fetch and process data
  d3.json(dataURL)
    .then((data) => {
      const baseTemperature = data.baseTemperature;
      const monthlyData = data.monthlyVariance;

      // X Scale (Years)
      const years = monthlyData.map((d) => d.year);
      const xScale = d3.scaleBand().domain(years).range([0, width]).padding(0);

      // X Axis
      svg
        .append('g')
        .attr('id', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(
          d3
            .axisBottom(xScale)
            .tickValues(xScale.domain().filter((year) => year % 10 === 0))
        );

      // Y Scale (Months)
      const yScale = d3
        .scaleBand()
        .domain(monthNames.reverse())
        .range([height, 0])
        .padding(0);

      // Y Axis
      svg.append('g').attr('id', 'y-axis').call(d3.axisLeft(yScale));

      // Title
      svg
        .append('text')
        .attr('id', 'title')
        .attr('x', width / 2)
        .attr('y', -margin.top / 1.7)
        .attr('text-anchor', 'middle')
        .style('font-size', '26px')
        .text('Monthly Global Land-Surface Temperature');

      // Description
      svg
        .append('text')
        .attr('id', 'description')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2 + 18)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .text('Temperatures from 1754 to 2015');

      // Color Scale
      const reversedRdBu = (t) => d3.interpolateRdBu(1 - t);

      const colorScale = d3
        .scaleSequential()
        .domain([
          d3.min(monthlyData, (d) => baseTemperature + d.variance),
          d3.max(monthlyData, (d) => baseTemperature + d.variance),
        ])
        .interpolator(reversedRdBu);

      // Create Cells
      svg
        .selectAll('.cell')
        .data(monthlyData)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', (d) => xScale(d.year))
        .attr('y', (d) => yScale(monthNames[12 - d.month]))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', (d) => colorScale(baseTemperature + d.variance))
        .attr('data-month', (d) => d.month - 1)
        .attr('data-year', (d) => d.year)
        .attr('data-temp', (d) => baseTemperature + d.variance)
        .on('mouseover', (event, d) => {
          tooltip.transition().duration(200).style('opacity', 0.9);
          tooltip
            .html(
              `
            Year: ${d.year}<br>
            Month: ${monthNames[12 - d.month]}<br>
            Temperature: ${(baseTemperature + d.variance).toFixed(2)}°C<br>
            Variance: ${d.variance.toFixed(2)}°C
          `
            )
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`)
            .attr('data-year', d.year);
        })
        .on('mouseout', () => {
          tooltip.transition().duration(500).style('opacity', 0);
        });

      // Legend
      const [minTemp, maxTemp] = d3.extent(
        monthlyData,
        (d) => baseTemperature + d.variance
      );
      const legendColors = [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.75, 0.9, 1].map(
        reversedRdBu
      );

      const legendThreshold = d3
        .scaleThreshold()
        .domain(
          (() => {
            const step = (maxTemp - minTemp) / legendColors.length;
            return Array.from(
              { length: legendColors.length - 1 },
              (_, i) => minTemp + (i + 1) * step
            );
          })()
        )
        .range(legendColors);

      const legendX = d3
        .scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, 350]);

      const legend = svg
        .append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${(width - 350) / 2}, ${height + 50})`);

      legend
        .selectAll('rect')
        .data(
          legendThreshold.range().map((color) => {
            const extent = legendThreshold.invertExtent(color);
            return [extent[0] ?? minTemp, extent[1] ?? maxTemp];
          })
        )
        .enter()
        .append('rect')
        .attr('x', (d) => legendX(d[0]))
        .attr('y', 0)
        .attr('width', (d) => legendX(d[1]) - legendX(d[0]))
        .attr('height', 30)
        .attr('fill', (d) => legendThreshold(d[0]));

      const legendXAxis = d3
        .axisBottom(legendX)
        .tickSize(10, 0)
        .tickValues(legendThreshold.domain())
        .tickFormat(d3.format('.1f'));

      legend.append('g').attr('transform', 'translate(0,30)').call(legendXAxis);
    })
    .catch((error) => console.error('Error loading the data:', error));
});
