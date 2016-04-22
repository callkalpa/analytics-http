var pref = new gadgets.Prefs();
var delay;
var chartData = [];
var options;
var plot;
var node = pref.getString("node") || undefined;
var start = pref.getString("startTime") || undefined;
var end  = pref.getString("endTime") || undefined;
var appname = pref.getString("appname") ||undefined;
$(function () {

    getQueryParams(parent.document.location.href);

    var pauseBtn = $("button.pause");
    pauseBtn.click(function () {
        $(this).toggleClass('btn-warning');
        togglePause($(this));
    });
    $(".reset").click(function () {
        fetchData();
    });

    fetchData();

    if (pref.getString("pause").toLowerCase() == "yes") {
        document.getElementById("pauseBtn").style.visibility = 'visible';
    }


});

function getQueryParams(url){
    if(url.indexOf("?") > -1){
        var vars = url.split('?');
        var params = vars[1].split('&');

        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split('=');
            if (decodeURIComponent(pair[0]) == 'appname') {
                appname = (decodeURIComponent(pair[1]));
                console.log(appname);
            }
            if (decodeURIComponent(pair[0]) == 'start-time') {
                start = (moment((decodeURIComponent(pair[1])), 'X').format('YYYY-MM-DD HH:mm'));
                console.log((moment((decodeURIComponent(pair[1])), 'X').format('YYYY-MM-DD HH:mm')));
            }
            if (decodeURIComponent(pair[0]) == 'end-time') {
                end = (moment((decodeURIComponent(pair[1])), 'X').format('YYYY-MM-DD HH:mm'));
                console.log((moment((decodeURIComponent(pair[1])), 'X').format('YYYY-MM-DD HH:mm')));
            }
        }
    }

}

$(window).load(function(){
    var parentWindow = window.parent.document,
        thisParentWrapper = $('#'+gadgets.rpc.RPC_ID, parentWindow).closest('.gadget-body');
    $(thisParentWrapper).closest('.ues-component-box').addClass('info-widget form-control-widget');
});

function togglePause(btnElm) {
    if (btnElm.hasClass('btn-warning')) {
        clearTimeout(delay);
    }
    else {
        if (isNumber(pref.getString("updateGraph")) && !(pref.getString("updateGraph") == "0")) {
            delay = setTimeout(function () {
                fetchData()
            },
            pref.getString("updateGraph") * 1000);
        }
    }
}

var drawChart = function (data, options) {

    plot = $.plot("#placeholder", data, options);

    var previousPoint = null;


     $("#placeholder").bind("plothover", function (event, pos, item) {

        if ($("#enablePosition:checked").length > 0) {
            var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
            $("#hoverdata").text(str);
        }


        if (item) {
            if (previousPoint != item.dataIndex) {

                previousPoint = item.dataIndex;

                $("#tooltip").remove();
                var x = item.datapoint[0],
                    y = item.datapoint[1];

//                showTooltip(item.pageX, item.pageY,y,item.series.data[item.dataIndex][2]);
                showTooltip(item.pageX, item.pageY,item.series.data[item.dataIndex][2]);
            }
        } else {
            $("#tooltip").remove();
            previousPoint = null;
        }
    });


};

function fetchData() {
    var url = pref.getString("dataSource");
    var statType = pref.getString("appStatType");
    $('.panel-heading').addClass(statType);

    var data = {
        start_time: start,
        end_time: end,
        node: node,
        action: statType
    };

    if(appname!=""){
        data.appname = appname;
    }

    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: data,
        success: onDataReceived
    });
    var pauseBtn = $("button.pause");
    togglePause(pauseBtn);
}
function onDataReceived(data) {
    $('.total-count').text(data.total != undefined ? data.total.toLocaleString() : '');
    $('.measure-label').text(data.measure_label);
    $('#max-count').text(data.max != undefined ? data.max.toLocaleString() : '');
    $('.avg-count').text(data.avg != undefined ? data.avg.toLocaleString() : '');
    $('#min-count').text(data.min != undefined ? data.min.toLocaleString() : '');
    $('.statistics-main').text(data.title);
    $('.error-percentage').text(data.percentage != undefined ? data.percentage.toLocaleString() : '');
    if( data.graph){
        chartData = {"label" : "count", "data" : data.graph};
            options =
            {
                "legend": {
                    "show": false
                },
                "series": {
                    "shadowSize": 1,
                    "bars": {
                        "show": true,
                        lineWidth: 0, // in pixels
                        barWidth: 0.8, // in units of the x axis
                        fill: true,
                        fillColor: '#ffffff',
                        align: "center" // "left", "right", or "center"
                    }
                },
                "grid": {
                    "show": false,
                    hoverable: true,
                    clickable: true
                }
            };
        var chartOptions = options;
        var _chartData = [];
//    addSeriesCheckboxes(chartData);
        $.each(chartData, function (key) {
            _chartData.push(chartData[key]);
        });
        //console.info(chartData);
        drawChart(_chartData, chartOptions);
        var seriesContainer = $("#optionsRight");
        seriesContainer.find(":checkbox").click(function () {
            filterSeries(chartData);
        });
    }
}

function showTooltip(x, y, contents) {
    $("<div id='tooltip'>" + contents + "</div>").css({
        top: y + 10,
        left: x + 10
    }).appendTo("body").fadeIn(200);
}
function addSeriesCheckboxes(data) {
    // insert checkboxes
    var seriesContainer = $("#optionsRight").find(".series-toggle");
    seriesContainer.html("");
    var objCount = 0;
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            objCount++;
        }
    }
    if (objCount > 1) {
        $.each(data, function (key, val) {
            seriesContainer.append("<li><input type='checkbox' name='" + key +
                "' checked='checked' id='id" + key + "'/>" +
                "<label for='id" + key + "' class='seriesLabel'>"
                + val.label + "</label></li>");
        });
    }
}
function filterSeries(data) {
    var filteredData = [];
    var seriesContainer = $("#optionsRight");
    seriesContainer.find("input:checked").each(function () {
        var key = $(this).attr("name");
        if (key && data[key]) {
            var pausebtn = $("button.pause");
            if (!pausebtn.hasClass('btn-warning')) {
                $(pausebtn).toggleClass('btn-warning');
            }
            togglePause(pausebtn);
            filteredData.push(data[key]);
        }
        drawChart(filteredData, options);

    });
}
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


gadgets.HubSettings.onConnect = function () {

    //gadgets.Hub.subscribe('wso2.gadgets.charts.timeRangeChange',
    //    function (topic, data, subscriberData) {
    //        start = data.start.format('YYYY-MM-DD HH:mm');
    //        end = data.end.format('YYYY-MM-DD HH:mm');
    //        fetchData();
    //    }
    //);
    //
    //gadgets.Hub.subscribe('wso2.gadgets.charts.ipChange',
    //    function (topic, data, subscriberData) {
    //        node = data;
    //        fetchData();
    //    }
    //);
    gadgets.Hub.subscribe('timeRangeChangeSubscriber',
        function (topic, data, subscriberData) {
            //alert("Subscriber just received dates " +data.start + " and " +data.end);
            start = data.start;
            end = data.end;
            fetchData();
        }
    );
};


