const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
    .attr('width', barWidth)
    .attr('height', height);

const scatterPlot = d3.select('#scatter-plot')
    .attr('width', width)
    .attr('height', height);

const lineChart = d3.select('#line-chart')
    .attr('width', width)
    .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'child-mortality';
let selected = 'Russia';

const x = d3.scaleLinear().range([margin * 2, width - margin]);
const y = d3.scaleLinear().range([height - margin, margin]);

const xBar = d3.scaleBand().range([margin * 2, barWidth - margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height - margin, margin])

const xLine = d3.scaleTime().range([margin * 2, width - margin]);
const yLine = d3.scaleLinear().range([height - margin, margin]);

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height - margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height - margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height - margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {
    colorScale.domain(d3.set(data.map(d => d.region)).values());
    barChart.on('click', handleBarClick);

    d3.select('#range').on('input', function () {
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function () {
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function () {
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function () {
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function () {
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function () {
        lineParam = d3.select(this).property('value');
        updateLinePlot();
    });

    function updateLinePlot() {
        const index = data.findIndex(item => item.country === selected);
        const item = data[index][lineParam];
        let entries = Object.entries(item).slice(0, -5)
        let xScaler = xLine.domain(d3.extent(entries.map(entry => new Date(entry[0]))));
        let yScaler = yLine.domain(d3.extent(entries.map(entry => parseFloat(entry[1]) || 0)));
        lineChart.selectAll('path').remove();
        countryName.html(selected);
        xLineAxis.call(d3.axisBottom(xScaler));
        yLineAxis.call(d3.axisLeft(yScaler));
        lineChart.append('path')
            .datum(entries)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => xScaler(new Date(d[0])))
                .y(d => yScaler(parseFloat(d[1]) || 0)))
    }

    function updateBar() {
        let meanData = d3.nest()
            .key(d => d['region'])
            .rollup(v => d3.mean(v, d => parseFloat(d[param][year]) || 0))
            .entries(data);
        let xScaler = xBar.domain(['asia', 'europe', 'africa', 'americas']);
        let yScaler = yBar.domain([0, d3.max(meanData.map(d => d.value))]);
        xBarAxis.call(d3.axisBottom(xScaler));
        yBarAxis.call(d3.axisLeft(yScaler));

        barHandler(barChart.selectAll(".bar")
            .data(meanData)
            .enter().append("rect").on('click', handleBarClick), xScaler, yScaler);

        barHandler(barChart.selectAll(".bar")
            .data(meanData)
            .transition(), xScaler, yScaler);
    }

    function barHandler(selection, xScaler, yScaler) {
        selection.attr("class", "bar")
            .attr("x", d => xScaler(d.key))
            .attr("y", d => yScaler(d.value))
            .attr("width", xScaler.bandwidth())
            .attr("height", d => height - margin - yScaler(d.value))
            .attr('fill', d => colorScale(d.key));
    }

    function handleBarClick(dClicked, i) {
        barChart.selectAll('.bar')
            .transition()
            .style('opacity', d => d.key === dClicked.key ? 1.0 : 0.5);

        scatterPlot.selectAll('circle').transition()
            .style('opacity', d => d.region === dClicked.key ? 0.7 : 0);
        d3.event.stopPropagation();
    }

    function updateScatterPlot() {
        let rScaler = radiusScale.domain(d3.extent(data.map(d => parseFloat(d[rParam][year]) || 0)));
        let xScaler = x.domain(d3.extent(data.map(d => parseFloat(d[xParam][year]) || 0)));
        let yScaler = y.domain(d3.extent(data.map(d => parseFloat(d[yParam][year]) || 0)));
        xAxis.call(d3.axisBottom(xScaler));
        yAxis.call(d3.axisLeft(yScaler));

        scatterHandler(scatterPlot.selectAll('circle')
            .data(data)
            .enter().append('circle').on('click', handleScatterClick), xScaler, yScaler, rScaler);

        scatterHandler(scatterPlot.selectAll('circle')
            .data(data)
            .transition(), xScaler, yScaler, rScaler);
    }

    function scatterHandler(selection, xScaler, yScaler, rScaler) {
        selection.attr('r', d => rScaler(parseFloat(d[rParam][year]) || 0))
            .attr('cx', d => xScaler(parseFloat(d[xParam][year]) || 0))
            .attr('cy', d => yScaler(parseFloat(d[yParam][year]) || 0))
            .attr('fill', d => colorScale(d['region']));
    }

    function handleScatterClick(dClicked, i) {
        selected = dClicked.country
        scatterPlot.selectAll('circle')
            .transition()
            .attr('stroke-width', d => d.country === dClicked.country ? 2 : 1);
        d3.select(this).raise();
        d3.event.stopPropagation();
        updateLinePlot();
    }

    updateBar();
    updateScatterPlot();
    updateLinePlot();
});


async function loadData() {
    const data = {
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };

    return data.population.map(d => {
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}