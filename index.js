var svg = d3.select("svg");

var width = svg.node().getBoundingClientRect().width;
var height = svg.node().getBoundingClientRect().height;

var link, node, texts, data;
var graph;

// load the data
d3.json("newdata.json", function (error, _graph) {
    if (error) throw error;
    graph = _graph;
    data = _graph.data;
    initializeDisplay();
    initializeSimulation();
    addVendorTypeState();
});


var simulation = d3.forceSimulation();

// set up the simulation and event to update locations after each tick
function initializeSimulation() {
    simulation.nodes(graph.nodes);
    initializeForces();
    simulation.on("tick", ticked);
}


// add forces to the simulation
function initializeForces() {
    // add forces and associate each with a name
    simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces();
}

// apply new force properties
function updateForces() {
    // get each force by name and update the properties
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);
    simulation.force("link")
        .id(function (d) { return d.id; })
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}


// generate the svg objects and force simulation
function initializeDisplay() {
    // set the data and properties of link lines
    link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .style("stroke", d => linkColour(d));

    // set the data and properties of node circles
    node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("fill", d => circleColour(d))
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    // node tooltip
    node.append("title")
        .text(function (d) { return 'id: ' + d.id + '\n' + 'state : ' + d.state + '\n' + 'city : ' + d.city + '\n' + 'region : ' + d.region + '\n' + 'vendor : ' + d.vendor + '\n' + 'type : ' + d.type; });

    node.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function (d) { return d.id });

    // visualize the graph
    updateDisplay();
}

// update the display based on the forces (but not positions)
function updateDisplay() {
    node
        .attr("r", forceProperties.collide.radius)
        .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
        .attr("stroke-width", forceProperties.charge.enabled == false ? 0 : Math.abs(forceProperties.charge.strength) / 15);

    link
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// update the display positions after each simulation tick
function ticked() {
    link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });
    d3.select('#alpha_value').style('flex-basis', (simulation.alpha() * 100) + '%');
}


function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0.0001);
    d.fx = null;
    d.fy = null;
}

// update size-related forces
d3.select(window).on("resize", function () {
    width = +svg.node().getBoundingClientRect().width;
    height = +svg.node().getBoundingClientRect().height;
    updateForces();
});

// convenience function to update everything (run after UI input)
function updateAll() {
    updateForces();
    updateDisplay();
}

// values for all forces
forceProperties = {
    center: {
        x: 0.5,
        y: 0.5
    },
    charge: {
        enabled: true,
        strength: -30,
        distanceMin: 1,
        distanceMax: 2000
    },
    collide: {
        enabled: true,
        strength: .7,
        iterations: 1,
        radius: 5
    },
    forceX: {
        enabled: false,
        strength: .1,
        x: .5
    },
    forceY: {
        enabled: false,
        strength: .1,
        y: .5
    },
    link: {
        enabled: true,
        distance: 30,
        iterations: 1
    }
}

function stateupdate() {
    var item = document.getElementById('state');
    var state = item.options[item.selectedIndex].text;

    console.log('state=>', state);
    reset();

    // update city
    removeSelect('city');
    addSelect('city');

    updateOnAll();
}

function cityupdate() {
    var item = document.getElementById('city');
    var city = item.options[item.selectedIndex].text;

    console.log('city=>', city);

    reset();

    // update city
    removeSelect('region');
    addSelect('region');

    updateOnAll();
}

function regionupdate() {
    var item = document.getElementById('region');
    var region = item.options[item.selectedIndex].text;

    console.log('region=>', region);
    reset();

    updateOnAll();
}

function vendorupdate() {
    var item = document.getElementById('vendor');
    var vendor = item.options[item.selectedIndex].text;

    console.log('vendor=>', vendor);
    reset();

    updateOnAll();
}

function typeupdate() {
    var item = document.getElementById('type');
    var type = item.options[item.selectedIndex].text;

    console.log('type=>', type);
    reset();

    updateOnAll();
}


function updateOnAll() {
    var item1 = document.getElementById('state');
    var state = item1.options[item1.selectedIndex] ? item1.options[item1.selectedIndex].text : "All";
    var item2 = document.getElementById('city');
    var city = item2.options[item2.selectedIndex] ? item2.options[item2.selectedIndex].text : "All";
    var item3 = document.getElementById('region');
    var region = item3.options[item3.selectedIndex] ? item3.options[item3.selectedIndex].text : "All";
    var item4 = document.getElementById('vendor');
    var vendor = item4.options[item4.selectedIndex] ? item4.options[item4.selectedIndex].text : "All";
    var item5 = document.getElementById('type');
    var type = item5.options[item5.selectedIndex] ? item5.options[item5.selectedIndex].text : "All";

    console.log(vendor, type, state, city, region);

    let arr = [];
    var selected = node.filter((d, i) => {
        let flag = ((vendor != "All") ? (d.vendor != vendor) : false) ||
            ((type != "All") ? (d.type != type) : false) ||
            ((state != "All") ? (d.state != state) : false) ||
            ((city != "All") ? (d.city != city) : false) ||
            ((region != "All") ? (d.region != region) : false);

        console.log(d, flag);
        if (!flag) {
            arr.push(d.id);
        }
        return flag;
    });
    selected.style("opacity", "0");

    console.log('arr=>', arr);
    var linkages = link.filter((l, i) => {
        return !arr.includes(l.source.id) || !arr.includes(l.target.id);
    })
    console.log('linkages=>', linkages);
    linkages.style("opacity", "0");

    // var linkings = svg.selectAll(".links");
    // linkings.style("opacity", "0");
}

function removeSelect(id) {
    // remove existing options
    var select = document.getElementById(id);
    var length = select.options.length;
    for (i = length - 1; i >= 0; i--) {
        select.options[i] = null;
    }

    if (id == "city") {
        removeSelect("region");
    }
}

function addSelect(id) {
    var select = document.getElementById(id); // city

    var item = document.getElementById('state');
    var state = item.options[item.selectedIndex].text;
    if (!graph.data[state] || graph.data[state] == null) {
        return;
    }
    let dict = graph.data[state][0];
    let cityList = Object.keys(dict);

    if (id == "city") {
        if (cityList && cityList.length > 0) {
            addtoArray(select, cityList);
        }
    }
    if (id == "region") {
        var item1 = document.getElementById('city');
        var region = document.getElementById('region');
        var city = item1.options[item1.selectedIndex].text;
        let regionList = graph.data[state][0][city]
        console.log('regionList=>', regionList);
        if (regionList && regionList.length > 0) {
            addtoArray(region, regionList);
        }
    }
}


function addVendorTypeState() {
    var vendor = document.getElementById('vendor');
    var type = document.getElementById('type');
    var state = document.getElementById('state');

    let vendorList = graph.vendor;
    let typeList = graph.type;
    let stateList = graph.state;

    addtoArray(vendor, vendorList);
    addtoArray(type, typeList);
    addtoArray(state, stateList);
}

function addtoArray(element, arrayList) {
    let option = document.createElement("option");
    option.text = "All";
    option.value = "All";
    option.defaultSelected = true;
    element.add(option);

    for (let i = 0; i < arrayList.length; i++) {
        let option = document.createElement("option");
        option.text = arrayList[i];
        option.value = arrayList[i];
        element.add(option);
    }
}

function reset() {
    console.log('reset called');
    node.style("opacity", "1");

    var links = svg.selectAll(".links");
    links.style("opacity", "1");

    var linkages = link;
    linkages.style("opacity", "1");
}

function circleColour(d) {
    switch (d.state) {
        case "TN":
            return "red"
            break;
        case "MA":
            return "blue"
            break;
        case "WB":
            return "green"
            break;
        case "Delhi":
            return "yellow"
            break;
        default:
            return "black";
    }
}

function linkColour(d) {
    switch (d.source) {
        case 1:
            return "red"
            break;
        case 2:
            return "blue"
            break;
        case 3:
            return "green"
            break;
        case 4:
            return "yellow"
            break;
        default:
            return "black";
    }
}

