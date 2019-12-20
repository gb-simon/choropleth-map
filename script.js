const eduUrl = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json',
  countyUrl = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json',
  dimensions = {
    width: 960,
    height: 500,
    margin: {
      x: 50,
      y: 100
    }
  },
tooltip = d3.select('#container')
  .append('div')
  .attr('id', 'tooltip')
  .style('opacity', 0),
colours = ["#d8fcd6", "#b5e7ac", "#93d189", "#73ba6a", "#56a351", "#3b8c3f", "#257533", "#125d2e", "#05462e"],
path = d3.geoPath(),
map = d3.map(),
svg = d3.select('#container')
  .append('svg')
    .attr('width', dimensions.width + dimensions.margin.x)
    .attr('height', dimensions.height + dimensions.margin.y)
  .append('g')
    .attr('transform', 'translate(0,0)'),
apis = d3.queue()
  apis.defer(d3.json, eduUrl)
  apis.defer(d3.json, countyUrl)
  apis.await((err, edu, county) => {
    if(err) throw err;
    const eduMin = d3.min(edu.map(d => d.bachelorsOrHigher)),
      eduMax = d3.max(edu.map(d => d.bachelorsOrHigher)),
      x = d3.scaleLinear()
        .domain([eduMin, eduMax])
        .range([0, dimensions.width / 2]),
      threshold = d3.scaleThreshold()
        .domain(d3.range(eduMin, eduMax, (eduMax - eduMin) / colours.length + 1))
        .range(colours),
      xAxis = d3.axisBottom(x)
        .tickValues(threshold.domain())
        .tickFormat((d) => `${Math.round(d)}%`)
    svg.append('g')
      .attr('class', 'key')
      .attr('id', 'legend')
      .attr('transform', 'translate(250,10)')
      .call(xAxis)
      .selectAll('rect')
      .data(threshold.range().map(d => {
        d = threshold.invertExtent(d);
        if(d[0] == null) d[0] = x.domain()[0];
        if(d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
      .enter()
      .append('rect')
        .attr('height', 10)
        .attr('x', (d) => x(d[0]))
        .attr('y', -10)
        .attr('width', (d) => x(d[1]) - x(d[0]))
        .attr('fill', (d) => threshold(d[0]))
    svg.append('g')
      .attr('class', 'counties')
      .selectAll('path')
      .data(topojson.feature(county, county.objects.counties).features)
      .enter()
      .append('path')
        .attr('class', 'county')
        .attr('fill', (d) => {
          let temp = edu.filter(obj => obj.fips == d.id)
          return temp[0] ? threshold(temp[0].bachelorsOrHigher) : threshold[0];
        })
        .attr('d', path)
        .attr('data-fips', (d) => d.id)
        .attr('data-education', (d) => {
          let temp = edu.filter(obj => obj.fips == d.id)
          if(temp[0])
          return temp[0].bachelorsOrHigher
        })
        .on('mouseover', (d, i) => {

          let temp = edu.filter( (obj) => obj.fips == d.id );
          if(temp[0]){
          d3.event.target.style.stroke = 'black';
          tooltip.style('opacity', 1);
          tooltip.style('left', (d) => `${d3.event.pageX + 20}px`)
            .style('top', (d) => `${d3.event.pageY + 20}px`)
            .html(
              `
              County: ${temp[0].area_name}
              </br>
              State: ${temp[0].state}
              </br>
              Bachelors or Higher: ${temp[0].bachelorsOrHigher}%
              `)
              // Set parameter for FCC
              .attr('data-fips', temp[0].fips)
              .attr('data-education', temp[0].bachelorsOrHigher)
          }
        })
        .on('mouseleave', (d) => {
          d3.event.target.style.stroke = 'none';
          tooltip
            .style('opacity', 0)
        });
      svg.append('path')
        .data([topojson.mesh(county, county.objects.states, (a, b) => a !== b)])
        .attr('class', 'states')
        .attr('d', path);
  })