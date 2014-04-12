'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', [])
    /**
     * A service to get server time
     */
   .factory('servertime', function($http) {
        var servertime = {
            async: function() {
                var promise = $http.jsonp('http://developer.yahooapis.com/TimeService/V1/getTime?appid=YahooDemo&output=json&callback=JSON_CALLBACK',  {withCredentials: false})
                        .then(function(response) {
                            // The return value gets picked up by the then in the controller.
                            return response.data.Result.Timestamp;
                        });
                // Return the promise to the controller
                return promise;
            }
        };

        return servertime;
    });