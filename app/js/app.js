'use strict';

// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', [
    'ngRoute', 'ngAnimate', 'ngSanitize',
    'myApp.config',
    'myApp.filters',
    'myApp.services',
    'myApp.directives',
    'myApp.controllers',
    "firebase", 'ui.bootstrap'
]).
config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/game', {templateUrl: 'partials/main.html', controller: 'MainCtrl'});
        $routeProvider.when('/rank', {templateUrl: 'partials/rank.html', controller: 'RankCtrl'});
        $routeProvider.when('/about', {templateUrl: 'partials/about.html', controller: 'AboutCtrl'});
        $routeProvider.otherwise({redirectTo: '/game'});
    }]);

myApp.run(['$rootScope', '$modal', 'HASHBANG', 'FIREBASE_URL', '$firebaseSimpleLogin', '$firebase', '$log',
    function($rootScope, $modal, HASHBANG, URL, $firebaseSimpleLogin, $firebase, $log) {
        $rootScope.page = 'main';
        $rootScope.loaded = false;
        $rootScope.authing = true;
        $rootScope.user = null;
        $rootScope.hashbang = HASHBANG;
        
        $rootScope.ref = new Firebase(URL);
        $rootScope.fbref = $firebase($rootScope.ref);
        $rootScope.auth = $firebaseSimpleLogin($rootScope.ref);
        $rootScope.firebasecon = true;
        
        var auth = new FirebaseSimpleLogin($rootScope.ref, function(error, user) {
            if (error) {
                $rootScope.setloaded(true);
                $rootScope.authing = false;
                $rootScope.loginstatus = 'error';
                // an error occurred while attempting login
                $log.debug('an error is occured');
                $rootScope.putoffline();
            } else if (user) {
                $rootScope.setloaded(false);
                // user authenticated with Firebase
                console.log('Welcome to Getourguide ' + user.displayName);
                $rootScope.user = user;
                $rootScope.setloaded(true);
                $rootScope.authing = false;
                $rootScope.loginstatus = 'ok';
            } else {
                $rootScope.setloaded(true);
                $rootScope.authing = false;
                $rootScope.loginstatus = 'logout';
                // user is logged out
                $log.debug('user is logged out');
            }
        });
        
        $rootScope.logout = function(){
            $rootScope.auth.$logout();
            $rootScope.firebasecon = false;

            $rootScope.user = null;
        };
        
        $rootScope.putonline = function() {
            if (!$rootScope.firebasecon) {
                Firebase.goOnline();
                $rootScope.firebasecon = true;
            }
        };

        $rootScope.putoffline = function() {
            if ($rootScope.firebasecon) {
                Firebase.goOffline();
                $rootScope.firebasecon = false;
            }
        };
        
        $rootScope.setloaded = function(loaded) {
            $rootScope.loaded = loaded;
        };
    }
]);

angular.module('ui.bootstrap.carousel', ['ui.bootstrap.transition'])
    .controller('CarouselController', ['$scope', '$timeout', '$transition', '$q', function        ($scope, $timeout, $transition, $q) {
}]).directive('carousel', [function() {
    return {

    }
}]);