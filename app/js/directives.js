'use strict';

/* Directives */


angular.module('myApp.directives', []).
        directive('scrolledarea', function() {
            return function(scope, elm, attrs) {
                elm.mCustomScrollbar({
                    scrollInertia: 150,
                    advanced: {
                        updateOnContentResize: true
                    }
                });
            };
        });