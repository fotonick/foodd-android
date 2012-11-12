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
        document.addEventListener('deviceready', this.onDeviceReady, false);
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
    savePreferences: function() {
        // get fields from document
        var db = window.openDatabase("foodd_prefs", "1.0", "FoodD Preferences DB", 1024 * 1024);
        
        db.transaction(
            // Callback that executes SQL
            function (tx) {
                tx.executeSql('DROP TABLE IF EXISTS user_prefs;');
                tx.executeSql('CREATE TABLE user_prefs (user_id INTEGER PRIMARY KEY, distance INTEGER, explore INTEGER, yelp_rate_min INTEGER, personal_rate_min INTEGER, max_cost INTEGER, min_wait_repeat INTEGER);');
                tx.executeSql('INSERT INTO user_prefs (user_id, distance, explore, yelp_rate_min, personal_rate_min, max_cost, min_wait_repeat) VALUES (?, ?, ?, ?, ?, ?, ?);', [0, 1, 5, 3, 2, 4, 4]);
            },
            // Callback to handle errors
            function (err) {
                console.log("Error processing SQL: " + err.code);
            }
        )
    },
    displayLoadedPreferences: function (tx, results) {
        console.log("Preferences are:");
        pref_div = $("#preferences");
        prefs = results.rows.item(0);
        for (var key in prefs) {
            content = " " + key + ": " + prefs[key];
            prefElem = document.createElement("p");
            prefElem.innerHTML = content;
            pref_div.append(prefElem);
            console.log(content);
        }
    },
    loadPreferences: function() {
        console.log("calling loadPreferences");
        var db = window.openDatabase("foodd_prefs", "1.0", "FoodD Preferences DB", 1024 * 1024);

        user_id = 0;  // TODO: fetch from document
        console.log("Fetching preferences for user " + user_id);
        db.transaction(
            // Callback that executes SQL
            function(tx) {
                tx.executeSql('SELECT * FROM user_prefs WHERE user_id=?', [user_id],
                    // Callback on success; should manipulate document
                    app.displayLoadedPreferences,
                    // Callback to handle errors
                    function (err) {
                        console.log("Error in executeSql: " + err.code);
                    }
                );
            },
            // Callback to handle errors
            function (err) {
                console.log("Error processing transaction: " + err.code);
            }
        )

    },
    getLocation: function() {
        var onSuccess = function(position) {
            pref_div = $("#preferences");
            pref_div.innerHTML = 'Latitude: '          + position.coords.latitude          + '\n' +
                        'Longitude: '         + position.coords.longitude         + '\n' +
                        'Timestamp: '         + position.timestamp                + '\n';
        };

        function onError(error) {
            console.log('code: '    + error.code    + '\n' +
                        'message: ' + error.message + '\n');
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    },
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
