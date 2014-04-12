'use strict';

/* Controllers */

angular.module('myApp.controllers', ['myApp.services'])
        .controller('AboutCtrl', ['$rootScope',
            function($rootScope){
                $rootScope.page = 'about';
            }
        ])
        .controller('RankCtrl', ['$rootScope', '$scope', 'servertime', function($rootScope, $scope, servertime){
            $rootScope.page = 'rank';
            $scope.ranks = [];
            $rootScope.ref.child("ranks").on("child_added", function(object) {
                var rank = angular.fromJson(angular.toJson((object.val())));

                $scope.ranks.push(rank);
            });
        }])
        .controller('MainCtrl', ['$log', '$scope', '$rootScope', '$timeout', 'DEFAULT_HINTS', 'servertime',
            function($log, $scope, $rootScope, $timeout, DEFAULT_HINTS, servertime) {
                $rootScope.page = 'main';
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
                $scope.questions = [];
                $scope.activequestion = null;
                $scope.hints = DEFAULT_HINTS;
                $scope.botname = 'Matigeni Bot';

                $scope.$watch(
                        'user', function() {
                            if ($rootScope.user && typeof $rootScope.user !== 'undefined') {
                                if (!$scope.dashboardready) {
                                    $scope.loginaction($rootScope.user);
                                }
                            } else {
                                /*if (typeof $rootScope.loginstatus !== 'undefined') {
                                    var modalInstance = $modal.open({
                                        templateUrl: 'forceLoginModal.html',
                                        controller: 'ForceLoginModalCtrl',
                                        resolve: {
                                        }
                                    });
                                    modalInstance.result.then(function() {
                                        $scope.login();
                                    }, function() {
                                    });
                                }*/
                            }
                        });

                $scope.logout = function(){
                    $rootScope.logout();
                    $scope.dashboardready = false;
                    $scope.chats = [];
                    $scope.users = {};
                    
                    $scope.sendingtext = false;
                    $scope.questions = new Array();
                    $scope.activequestion = null;
                    $scope.hints = DEFAULT_HINTS;
                };

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
                    
                    /* initialize points position on ranks table if not exist */
                    $rootScope.ref.child("ranks/" + user.id).once('value', function(snapshot) {
                        var object = snapshot.val();
                        if (!object) {
                            $rootScope.fbref.$child("ranks").$child($rootScope.user.id).$set({
                                id: $rootScope.user.id,
                                name: $rootScope.user.thirdPartyUserData.first_name,
                                points: 0
                            });
                        }
                    });
                    
                    $rootScope.ref.child("users/" + user.id).once('value', function(snapshot) {
                        $log.debug('reading user data from firebase');
                        var object = snapshot.val();
                        if (object) {
                            $rootScope.user.points = object.points;
                            $rootScope.user.questions = (object.questions)?object.questions:[];
                        } else {
                            $rootScope.user.points = 0;
                            $rootScope.user.questions = [];
                            $rootScope.fbref.$child("users").$child($rootScope.user.id).$set({
                                points: 0,
                                questions: {'dummy': 1}
                            });
                        }
                    });
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

                        //gritter_alert('Notification', user.name + " is " + user.status);
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
                            if($('#chatbox .panel-body#chat-text-list').length > 0)
                                $('#chatbox .panel-body#chat-text-list').mCustomScrollbar("scrollTo", "bottom");
                        }, 1000);

                    });
                    
                    $rootScope.ref.child("questions").on("child_added", function(object) {
                        $log.debug('adding questions added listener');
                        var question = angular.fromJson(angular.toJson((object.val())));
                        
                        var ask = true;
                        $.each($rootScope.user.questions, function(o, q){
                            if(_.has(q, 'id') && q.id == question.id){
                                ask = false;
                                return true;
                            }
                        });
                        
                        var q = {
                            id: question.id,
                            attempt: 0,
                            answer: question.answer,
                            point: question.first_point,
                            hints: _.compact(question.clues)
                        };
                        
                        $scope.questions.push(q);
                        
                        if($scope.activequestion == null) {
                            if(ask) {
                                $scope.activequestion = q;
                                $scope.hints = q.hints;
                                $scope.myguess = '';
                                servertime.async().then(function(time) {
                                    var chat = {
                                        action: 'chat',
                                        name: $scope.botname,
                                        text: 'Tetoott Tetoott. Here come New question...',
                                        timestamp: time,
                                        userid: null
                                    };
                                    $scope.chats.push(chat);
                                });

                                gritter_alert('Notification', 'Tetoott Tetoott. Here come New question...');
                            } else {
                                gritter_alert('Notification', 'You have answered all the questions. There\'s no more questions');
                            }
                        }

                    });
                };

                $scope.guess = function(){
                    if ($scope.myguess == '') {
                        gritter_alert('Notification', 'Ooops.. Nothing to guess. Please type some answer!');
                        return;
                    }
                    var arrAnswer = $scope.activequestion.answer.toLowerCase().split(' ');
                    var arrGuess = $scope.myguess.toLowerCase().split(' ');
                    var correct = true;
                    if(arrGuess.length < arrAnswer.length) {
                        correct = false;
                    }
                    $.each(arrAnswer, function(o, an){
                        if( _.indexOf(arrGuess, an) === -1 ) {
                            correct = false;
                            return true;
                        }
                    });
                    
                    if(correct){
                        gritter_alert('Notification', 'Congratss, you guessed it correctly. The Answer is: ' + $scope.activequestion.answer);
                        
                        servertime.async().then(function(time) {
                            $rootScope.user.questions.push({
                                id: $scope.activequestion.id,
                                timestamp: time
                            });
                            var p = parseInt($rootScope.user.points) + parseInt($scope.activequestion.point);
                            
                            $rootScope.fbref.$child("ranks").$child($rootScope.user.id).$update({
                                points: p
                            });
                            
                            $rootScope.fbref.$child("users").$child($rootScope.user.id).$update({
                                points: p,
                                questions: {'dummy': 1}
                            });
                            $rootScope.fbref.$child("users").$child($rootScope.user.id).$child('questions').$add({
                                id:$scope.activequestion.id,
                                timestamp: time
                            });
                            
                            $.each($scope.questions, function(o, v){
                                if(typeof v === 'undefined') return true;
                                if($scope.activequestion.id === v.id) {
                                    $scope.questions.splice(o, 1);
                                    return true;
                                }
                            });
                            
                            if($scope.questions.length == 0) {
                                gritter_alert('Notification', 'You have answered all the questions. There\'s no more questions');
                                $scope.activequestion = null;
                                $scope.hints = DEFAULT_HINTS;
                            } else {
                                servertime.async().then(function(time) {
                                    var chat = {
                                        action: 'chat',
                                        name: $scope.botname,
                                        text: 'Tetoott Tetoott. Here come New question...',
                                        timestamp: time,
                                        userid: null
                                    };
                                    $scope.chats.push(chat);

                                    gritter_alert('Notification', 'Tetoott Tetoott. Here come New question...');

                                    $.each($scope.questions, function(key, question){
                                        $scope.activequestion = question;
                                        return false;
                                    });
                                    $scope.hints = $scope.activequestion.hints;
                                });
                            }
                            
                            $scope.myguess = '';
                        });
                        
                    } else {
                        gritter_alert('Notification', 'Oooopss. The answer is not: ' + $scope.myguess);
                    }
                };

                $scope.sendtext = function() {
                    if ($scope.chattext == '') {
                        gritter_alert('Notification', 'Ooops.. Nothing to send. Please type some messages!');
                        return;
                    }
                    $scope.sendingtext = true;
                    servertime.async().then(function(time) {
                        $scope.fbref.$child("chats").$add({
                            userid: $rootScope.user.id,
                            name: $rootScope.user.thirdPartyUserData.first_name,
                            text: $scope.chattext,
                            action: 'chat',
                            timestamp: time}
                        );
                        $scope.sendingtext = false;
                    });
                };
            }]
        );
