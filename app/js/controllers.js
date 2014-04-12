'use strict';

/* Controllers */

angular.module('myApp.controllers', ['myApp.services'])
    .controller('MainCtrl', ['$log', '$scope', '$rootScope', '$timeout', 'servertime', 
    function($log, $scope, $rootScope, $timeout, servertime) {
        $("#transition-timer-carousel").on("slide.bs.carousel", function(event) {
            //The animate class gets removed so that it jumps straight back to 0%
            $(".transition-timer-carousel-progress-bar", this)
                    .removeClass("animate").css("width", "0%");
        }).on("slid.bs.carousel", function(event) {
            //The slide transition finished, so re-add the animate class so that
            //the timer bar takes time to fill up
            $(".transition-timer-carousel-progress-bar", this)
                    .addClass("animate").css("width", "100%");
        });

        //Kick off the initial slide animation when the document is ready
        $(".transition-timer-carousel-progress-bar", "#transition-timer-carousel")
                .css("width", "100%");
        
        $scope.dashboardready = false;
        $scope.chats = [];
        $scope.users = {};
        $scope.lastupdate = Math.round(+new Date() / 1000);
        $scope.sendingtext = false;

        $scope.$watch(
            'user',function() {
            if($rootScope.user && typeof $rootScope.user !== 'undefined') {
                if(!$scope.dashboardready) {
                    $scope.loginaction($rootScope.user);
                }
            } else {
                if(typeof $rootScope.loginstatus !== 'undefined') {
                    var modalInstance = $modal.open({
                        templateUrl: 'forceLoginModal.html',
                        controller: 'ForceLoginModalCtrl',
                        resolve: {
                        }
                    });
                    modalInstance.result.then(function() {
                        /* Login button clicked */
                        $scope.login();
                    }, function() {
                        /* cancel button clicked */
                    });
                }
            }
        });

        $scope.login = function() {
            $rootScope.putonline();

            $rootScope.setloaded(false);
            $rootScope.auth.$login('facebook', {
                rememberMe: true,
                scope: 'email,user_photos,user_about_me,user_hometown'
            }).then(function(user) {
                $scope.loginaction(user);
            }, function(error) {
                $rootScope.setloaded(true);
                $log.error('Login failed: ', error);
            });
        };
        
        $scope.loginaction = function(user) {
            console.log(user);
            $scope.dashboardready = true;
            $rootScope.ref.child("presence/" + user.id).once('value', function(snapshot) {
                $log.debug('reading user data from firebase');
                var object = snapshot.val();
                var numsession = 1;
                if (object) {
                    numsession += parseInt(object.numsession);
                }

                servertime.async().then(function(time) {
                    $rootScope.user.usersession = user.id + Math.floor((Math.random() * 10000) + 1);
                    $rootScope.fbref.$child("presence").$child($rootScope.user.id).$set({
                        id: user.id,
                        numsession: numsession,
                        name: user.thirdPartyUserData.first_name,
                        status: 'online',
                        timestamp: time
                    });

                    /* remove user log data if user disconnected */
                    $rootScope.ref.child("presence/" + user.id).onDisconnect().remove();

                    document.onIdle = function() {
                        $rootScope.fbref.$child("presence").$child($rootScope.user.id).$set({
                            id: user.id,
                            numsession: numsession,
                            name: user.thirdPartyUserData.first_name,
                            status: 'idle',
                            timestamp: time
                        });
                    };
                    document.onAway = function() {
                        $rootScope.fbref.$child("presence").$child($rootScope.user.id).$set({
                            id: user.id,
                            numsession: numsession,
                            name: user.thirdPartyUserData.first_name,
                            status: 'away',
                            timestamp: time
                        });
                        $rootScope.putoffline();

                        $log.debug('gooffline. removing user id' + $rootScope.user.id);
                    };
                    document.onBack = function(isIdle, isAway) {
                        $rootScope.putonline();

                        $rootScope.fbref.$child("presence").$child($rootScope.user.id).$set({
                            id: user.id,
                            numsession: numsession,
                            name: user.thirdPartyUserData.first_name,
                            status: 'online',
                            timestamp: time
                        });
                        $log.debug('goonline. adding user id' + $rootScope.user.id);
                    };

                    setIdleTimeout(15000);
                    setAwayTimeout(25000);
                });
            });
            
            $rootScope.ref.child("presence").on("child_added", function(object) {
                $log.debug('adding users added listener');
                var user = angular.fromJson(angular.toJson((object.val())));

                var seconddiff = Math.round(+new Date() / 1000) - parseInt(user.timestamp);
                var WEEKSECOND = 7 * 24 * 3600;
                if (typeof user.status === 'undefined' || seconddiff >= WEEKSECOND) {
                    $rootScope.fbref.$child("users").$remove(user.id);
                    return;
                }
                $log.debug('user added:' + user.name);
                $scope.users[user.id] = user;

                gritter_alert('Notification', user.name + " is " + user.status);
            });
            
            $rootScope.ref.child("presence").on("child_removed", function(object) {
                $log.debug('adding users removed listener');
                var user = angular.fromJson(angular.toJson((object.val())));
                delete $scope.users[user.id];
                //gritter_alert('Notification', user.name + " is no longer online ");
            });

            $log.debug('start user changed listener');
            $rootScope.ref.child("presence").on("child_changed", function(object) {
                $log.debug('adding users changed listener');
                var user = angular.fromJson(angular.toJson((object.val())));
                $scope.users[user.id] = user;
                //gritter_alert('Notification', user.name + " is " + user.status);
            });
            
            
            $rootScope.ref.child("chats").on("child_added", function(object) {
                $log.debug('adding chats added listener');
                var chat = angular.fromJson(angular.toJson((object.val())));
                $scope.chattext = '';
                $scope.chats.push(chat);

                if (chat.action != 'chat') {
                    var ts = parseInt(chat.timestamp);
                    var time = $scope.lastupdate;
                    if (time < ts && $rootScope.user && $rootScope.user.usersession != chat.usersession) {
                        time = ts;
                    }
                }

                $('#chatbox .panel-body#chat-text-list').mCustomScrollbar("update");
                $timeout(function() {
                    $('#chatbox .panel-body#chat-text-list').mCustomScrollbar("scrollTo", "bottom");
                }, 1000);

            });
        };
    }]);
