/*global d3, crossfilter, barChart, points */
var map;
var markers = [];
var polylines = [];

var filter;
var val1Dimension;
var val1Grouping;
var val2Dimension;
var val2Grouping;
var charts;
var domCharts;

var latDimension;
var lngDimension;
var idDimension;
var idGrouping;

function init() {
    initMap();
    initCrossfilter();

    // bind map bounds to lat/lng filter dimensions
    latDimension = filter.dimension(function(p) {
        return p.lat;
    });
    lngDimension = filter.dimension(function(p) {
        return p.lng;
    });
    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = this.getBounds();
        var northEast = bounds.getNorthEast();
        var southWest = bounds.getSouthWest();

        // NOTE: need to be careful with the dateline here
        lngDimension.filterRange([southWest.lng(), northEast.lng()]);
        latDimension.filterRange([southWest.lat(), northEast.lat()]);

        // NOTE: may want to debounce here, perhaps on requestAnimationFrame
        updateCharts();
    });

    // dimension and group for looking up currently selected markers
    idDimension = filter.dimension(function(p, i) {
        return i;
    });
    idGrouping = idDimension.group(function(id) {
        return id;
    });

    renderAll();
}

function initMap() {
    google.maps.visualRefresh = true;

    var bounds = new google.maps.LatLngBounds();
    for (point of points) {
        bounds.extend(new google.maps.LatLng(point.lat, point.lng));
    }

    var myLatlng = new google.maps.LatLng(38.1, -96.24);
    var mapOptions = {
        zoom: 4,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        panControl: false
    };
    map = new google.maps.Map(document.getElementById('map-div'), mapOptions);
    map.fitBounds(bounds);

    new google.maps.Marker({
        position: new google.maps.LatLng(points[0].lat, points[0].lng),
        map: map,
        title: 'Start'
    });

    new google.maps.Marker({
        position: new google.maps.LatLng(points[points.length - 1].lat, points[points.length - 1].lng),
        map: map,
        title: 'Stop'
    });

    for (var i = 0; i < points.length - 1; i++) {
        var color;
        color = "red";
        polylines[i] = new google.maps.Polyline({
            path: [{
                lat: points[i].lat,
                lng: points[i].lng
            }, {
                lat: points[i + 1].lat,
                lng: points[i + 1].lng
            }],
            strokeColor: color,
            // strokeOpacity: 1.0,
            strokeWeight: 4,
            map: map
        });
    }
}

function initCrossfilter() {
    filter = crossfilter(points);

    // simple dimensions and groupings for major variables
    val1Dimension = filter.dimension(
        function(p) {
            return p.pace;
        });
    val1Grouping = val1Dimension.group(
        function(v) {
            // return Math.floor(v/3)*3;
            return v;
        });

    val2Dimension = filter.dimension(
        function(p) {
            return p.heart_rate;
        });
    val2Grouping = val2Dimension.group(
        function(v) {
            return v;
        });
        
    val3Dimension = filter.dimension(
        function(p) {
            return p.elev;
        });
    val3Grouping = val3Dimension.group(
        function(v) {
            return v;
        });

    // initialize charts (helper function in chart.js)
    // taken directly from crossfilter's example
    charts = [
        barChart()
        .dimension(val1Dimension)
        .group(val1Grouping)
        .x(d3.scale.linear()
            .domain([2, 11])
            .rangeRound([0, 40 * 10])),

        barChart()
        .dimension(val2Dimension)
        .group(val2Grouping)
        .x(d3.scale.linear()
            .domain([120, 200])
            .rangeRound([0, 40 * 10]))
        .filter([150, 200]),
        
    barChart()
        .dimension(val3Dimension)
        .group(val3Grouping)
        .x(d3.scale.linear()
            .domain([-10, 20])
            .rangeRound([0, 40 * 10]))
    ];

    // bind charts to dom
    domCharts = d3.selectAll(".chart")
        .data(charts)
        .each(function(chart) {
            chart.on("brush", renderAll).on("brushend", renderAll);
        });
}

// Renders the specified chart
function render(method) {
    d3.select(this).call(method);
}

// Renders all of the charts
function updateCharts() {
    domCharts.each(render);
}

// set visibility of markers based on crossfilter
function updateMarkers() {
}

console.log(polylines);

function updatePolylines() {
    var pointIds = idGrouping.all();
    for (var i = 0; i < pointIds.length - 1; i++) {
        var pointId = pointIds[i];
        // console.log(pointIds);
        polylines[pointId.key].setVisible(pointId.value > 0);
    }
}

// Whenever the brush moves, re-render charts and map markers
function renderAll() {
    updateMarkers();
    updatePolylines();
    updateCharts();
}

// Reset a particular histogram
window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
};
