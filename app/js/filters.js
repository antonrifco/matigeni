'use strict';

/* Filters */

angular.module('myApp.filters', []).
        filter('interpolate', ['version', function(version) {
                return function(text) {
                    return String(text).replace(/\%VERSION\%/mg, version);
                };
            }])
        .filter('showMonth', function() {
            return function(timestamp) {
                if (typeof timestamp === 'undefined') {
                    return '';
                }
                ;
                var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                var date = new Date(timestamp * 1000);

                return monthNames[date.getMonth()] + ' ' + date.getFullYear();
            };
        })
        .filter('orderObjectBy', function() {
            return function(input, attribute) {
                if (!angular.isObject(input))
                    return input;

                var array = [];
                for (var objectKey in input) {
                    array.push(input[objectKey]);
                }

                array.sort(function(a, b) {
                    a = parseInt(a[attribute]);
                    b = parseInt(b[attribute]);
                    return b - a;
                });
                return array;
            };
        });
