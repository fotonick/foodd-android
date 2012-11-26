/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        // bind tomato ready animation
        document.addEventListener('deviceready', this.onDeviceReady, false);

        // bind prefs load
        $('#preferences_page').bind('pageinit', function () {app.displayPreferences(JSON.parse(window.localStorage.getItem('preferences')));});
        $('#save_preferences').bind('click', function () {window.localStorage.setItem('preferences', JSON.stringify(app.preferencesFormToKeyVal($('#preferences_form'))));});

        // bind settings load
        $('#settings_page').bind('pageinit', function () {app.displaySettings(JSON.parse(window.localStorage.getItem('settings')));});
        $('#save_settings').bind('click', function () {window.localStorage.setItem('settings', JSON.stringify(app.settingsFormToKeyVal($('#settings_form'))));});
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },

    // Preferences display/read
    displayPreferences: function (prefs) {
        for (var key in prefs) {
            $("#slider_" + key).val(prefs[key]).slider("refresh");
        }
    },
    preferencesFormToKeyVal: function (form) {
        return jQuery.extend.apply(null,
            form.find('input').map(function() {
                var elm = $(this);
                obj = {};
                obj[elm.attr('name').slice("slider_".length)] = elm.val();
                return obj;
            })
        )
    },

    // Settings display/read
    displaySettings: function (settings) {
        for (var key in settings) {
            $("#checkbox_" + key).attr("checked", settings[key]).checkboxradio("refresh");
        }
    },
    settingsFormToKeyVal: function (form) {
        return jQuery.extend.apply(null,
            form.find('input').map(function() {
                var elm = $(this);
                obj = {};
                obj[elm.attr('name').slice("checkbox_".length)] = elm.attr('checked')=='checked';
                return obj;
            })
        )
    },

    // Geolocation
    getLocation: function() {
        var onSuccess = function(position) {
            console.log('Latitude: '          + position.coords.latitude          + '\n' +
                        'Longitude: '         + position.coords.longitude         + '\n' +
                        'Timestamp: '         + position.timestamp                + '\n');
        };

        function onError(error) {
            console.log('code: '    + error.code    + '\n' +
                        'message: ' + error.message + '\n');
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    },

    // Yelp results
    getYelpResults: function() {
        // Taken quite directly from:
        // https://github.com/Yelp/yelp-api/blob/master/v2/js/search.html
        var auth = { 
            consumerKey: "lcpyjU7MLjcTXKz7PqOe1g", 
            consumerSecret: "iw0a_CmujGE9uGFji4oj91Twi0o",
            accessToken: "4EdVlVo3v1Kz04sgXCreRFF3QK7K5GZi",
            accessTokenSecret: "BlaQZIapwTTmOXJmdFR-LjHHUyU",
            serviceProvider: { 
              signatureMethod: "HMAC-SHA1"
            }
        };

        var terms = 'Restaurants';
        var near = 'San+Francisco';  // get from GPS

        var accessor = {
          consumerSecret: auth.consumerSecret,
          tokenSecret: auth.accessTokenSecret
        };

        parameters = [];
        parameters.push(['term', terms]);
        parameters.push(['location', near]);
        parameters.push(['callback', 'cb']);
        parameters.push(['oauth_consumer_key', auth.consumerKey]);
        parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
        parameters.push(['oauth_token', auth.accessToken]);
        parameters.push(['oauth_signature_method', auth.serviceProvider.signatureMethod]);

        var message = { 
          'action': 'http://api.yelp.com/v2/search',
          'method': 'GET',
          'parameters': parameters 
        };

        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);

        var parameterMap = OAuth.getParameterMap(message.parameters);
        parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)
        console.log(parameterMap);

        $.ajax({
            'url': message.action,
            'data': parameterMap,
            'cache': true,
            'dataType': 'jsonp',
            'jsonpCallback': false,
            'success': function(data, textStats, XMLHttpRequest) {
              console.log(data);
              var output = data;
              $("body").append(output);
            }
        });
    }
};

