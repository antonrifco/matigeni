'use strict';

/* Directives */


angular.module('myApp.directives', []).
        directive('scrolledarea', ['$timeout', function($timeout) {
            return function(scope, elm, attrs) {
                elm.mCustomScrollbar({
                    scrollInertia: 150,
                    advanced: {
                        updateOnContentResize: true
                    }
                });
            };
        }])
        .directive('ngEnter', function() {
            return function(scope, element, attrs) {
                element.bind("keydown keypress", function(event) {
                    if (event.which === 13) {
                        scope.$apply(function() {
                            scope.$eval(attrs.ngEnter);
                        });

                        event.preventDefault();
                    }
                });
            };
        });