var scoring = {
    
    initialize: function() {
        scoring.results = [];
        scoring.homeLat = 37.3776; //latitude of where we are
        scoring.homeLong = -121.9634; //longitude of where we are
        scoring.minRating = 4; //user's minimum rating
        scoring.maxDistance = 10; //user max distance in miles
        scoring.getYelpResults(0); //grab first 20 results
        scoring.getYelpResults(20); //grab next 20 results
    },

    getEuclidianDistance: function(lat0, long0, lat1, long1) { //given lat and long, find Euclidian distance in miles between two points
        var R = 3963; // mi 
        var dLat = (lat1-lat0)*Math.PI/180;
        var dLon = (long1-long0)*Math.PI/180;
        var lat0 = lat0*Math.PI/180;
        var lat1 = lat1*Math.PI/180;
        
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat0) * Math.cos(lat1); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c;
        return d;        
    },

    parseResults: function(results) {
        var names = [];
        var scores = [];
        for(var i=0;i<results.length;i++) {
            var distance = scoring.getEuclidianDistance(scoring.homeLat, scoring.homeLong,
                                             results[i].location.coordinate.latitude,
                                             results[i].location.coordinate.longitude);
            var rating = results[i].rating;
            if (rating >= scoring.minRating) {
                score = (0.5 + rating - scoring.minRating) + (scoring.maxDistance - distance);
                names.push(results[i].id);
                scores.push(score);
            }
        }
        var output = [names, scores];
        return output;
    },

    // Yelp results
    getYelpResults: function(offset) {
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
        var near = 'Santa+Clara';  // get from GPS
        var num_results = 20;

        var accessor = {
          consumerSecret: auth.consumerSecret,
          tokenSecret: auth.accessTokenSecret
        };

        parameters = [];
        parameters.push(['term', terms]);
        parameters.push(['limit', num_results]);
        parameters.push(['offset', offset]);
        parameters.push(['location', near]);
        var rand = Math.floor((Math.random()*1000)+1);
        parameters.push(['callback', 'cb'+rand]);
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
            'jsonpCallback': 'cb'+rand,
            'success': function(data, textStats, XMLHttpRequest) {
              var output = data;
              $("body").append(output);
              scoring.results = scoring.results.concat(output.businesses);
              var namesScores = scoring.parseResults(scoring.results);
              console.log("Contenders are: ");
              console.log(namesScores[0]);
              console.log(namesScores[1]);
              console.log("And the winner is...");
              console.log(namesScores[0][randomdraw(namesScores[1])]);
            }
        });
        
    }
};
