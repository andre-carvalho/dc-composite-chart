var composite = new dc.CompositeChart(d3.select('div.container').append('div'));
var suArea = [],
    suPerc = [];

Promise.all([d3.csv("mun_area.csv"), d3.csv("mun_percent.csv")]).then(function (results) {
    suArea = results[0];
    suPerc = results[1];

    var ndx = crossfilter();
    ndx.add(suArea
        .sort((a,b)=>{return (b['area']-a['area']);})
        .map(function (d,index) {
            let ret={ x: index, y2: 0, y1: d.area };
            return ret;
        }
    ));
    ndx.add(suPerc
        .sort((a,b)=>{return (b['perc']-a['perc']);})
        .map(function (d, index) {
        let ret={ x: index, y1: 0, y2: d.perc };
        return ret;
    }));

    var dim = ndx.dimension(dc.pluck('x')),
        grp1 = dim.group().reduceSum(dc.pluck('y1')),
        grp2 = dim.group().reduceSum(dc.pluck('y2'));

    let totalPercent = 0,
        wDefault=768,
        hDefault=350;

    let aBar=new dc.BarChart(composite)
    .dimension(dim)
    .colors('blue')
    .group(grp1, "Total area of DETER alerts in 30 days (km²)")
    .title(function (d) {
        let suName=suArea[d.key].name.split(':')[0];
        let suCode=suArea[d.key].name.split(':')[1];
        return 'Name: ' + suName + '\n'
        + 'Code: ' + suCode + '\n'
        + 'Individual area: ' + d.value + ' km²';
    })
    .yAxisPadding('5%')
    .centerBar(true);

    let aLine=new dc.LineChart(composite)
    .dimension(dim)
    .colors('red')
    .group(grp2, "Accumulated % of the total")
    .valueAccessor(function (d) {
        if (d.key == 0) totalPercent = 0;
        totalPercent = totalPercent + d.value;
        return totalPercent;
    })
    .title(function (d) {
        if (d.key == 0) totalPercent = 0;
        totalPercent = totalPercent + d.value;
        let suName=suArea[d.key].name.split(':')[0];
        let suCode=suArea[d.key].name.split(':')[1];
        return 'Name: ' + suName + '\n'
        + 'Code: ' + suCode + '\n'
        + 'Individual percentage: ' + d.value.toFixed(2) + '%\n'
        + 'Total percentage: ' + totalPercent.toFixed(2) + '%';
    })
    .useRightYAxis(true)
    .elasticY(true)
    .renderDataPoints({radius: 3, fillOpacity: 0.9, strokeOpacity: 0.9})
    .brushOn(false);

    let wLegendItem=250;// width of each legend item
    let wLegendTotal=wDefault-70;// full width of the graphic with left and right margins discounted

    let leg=dc.legend()
    .x( (wDefault-(wLegendItem*2))/2 )
    .y(hDefault-10)
    .horizontal(true)
    .itemWidth(wLegendItem)
    .legendWidth(wLegendTotal)
    .itemHeight(15)
    .gap(3);
    
    composite
        .width(wDefault)
        .height(hDefault)
        .margins({ top: 10, left: 35, right: 35, bottom: 50 })
        .x(d3.scaleLinear()).xAxisPadding(0.5).elasticX(true)
        //.yAxisLabel("area in km²")
        .legend(leg)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .shareTitle(false)
        .compose([aBar, aLine])
        .rightY(d3.scaleLinear().domain([0, 105]))
        //.rightYAxisLabel("Total percentage")
        .brushOn(false);
    
    composite.rightYAxis().tickFormat(function (v) {return v + '%';});

    composite.render();
});