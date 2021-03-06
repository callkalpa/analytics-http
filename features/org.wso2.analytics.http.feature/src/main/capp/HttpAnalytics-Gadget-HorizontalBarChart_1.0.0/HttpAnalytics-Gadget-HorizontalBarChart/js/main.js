/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var TOPIC = "timeRangeChangeSubscriber";
var pref = new gadgets.Prefs();
var timeFrom = gadgetUtil.timeFrom();
var timeTo = gadgetUtil.timeTo();
var node = gadgetUtil.node();
var appname = gadgetUtil.appName();
var statType = pref.getString("statType");
var yAxisLabel = pref.getString("yAxisLabel");
var chartColor = pref.getString("chartColor");
var targetPage = pref.getString("targetPage");

$(function () {
    fetchData();
});

function fetchData() {
    gadgetUtil.fetchData(CONTEXT, {
        start_time: timeFrom,
        end_time: timeTo,
        node: node,
        action: statType,
        appname: gadgetUtil.appName()
    }, onData, onError);
}

gadgets.HubSettings.onConnect = function () {
    gadgets.Hub.subscribe(TOPIC, function (topic, data, subscriberData) {
        timeFrom = data.start;
        timeTo = data.end;
        fetchData();
    });
};

function onData(data) {
    try {

        if (data.message.length == 0) {
            $("#canvas").html(gadgetUtil.getEmptyRecordsText());
            return;
        }
        var schema = [
            {
                "metadata": {
                    "names": [yAxisLabel, "Request Count"],
                    "types": ["ordinal", "linear"]
                },
                "data": []
            }
        ];
        var chartConfig = {
            type: "bar",
            x: yAxisLabel,
            charts: [
                { type: "bar", y: "Request Count", orientation: "left" }
            ],
            grid: false,
            width: $('body').width(),
            height: $('body').height(),
            colorScale: [chartColor],
            padding: { "top": 30, "left": 60, "bottom": 60, "right": 30 },
            textColor: "#000000",
            text: yAxisLabel,
            textAlign: "left",
            xAxisStrokeSize: 0,
            xAxisFontSize: 0
        };

        data.message.forEach(function (row, i) {
            schema[0].data.push([row.name, row.value]);
        });

        var onChartClick = function (event, item) {
            if (targetPage != gadgetUtil.getCurrentPageUrl()) {
                var targetUrl = BASE_URL + targetPage + gadgetUtil.getUrlParameters();
                parent.window.location = targetUrl;
            }
        };
        var chart = new vizg(schema, chartConfig);

        $("#canvas").empty();
        chart.draw("#canvas", [
            { type: "click", callback: onChartClick }
        ]);
    } catch (e) {
        $("#canvas").html(gadgetUtil.getErrorText(e));
    }
};

function onError(msg) {
    $("#canvas").html(gadgetUtil.getErrorText(msg));
};