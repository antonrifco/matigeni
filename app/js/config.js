
angular.module('myApp.config', [])
        .constant('version', '0.9.1')

        .constant('WEBURL', 'http://matigeni.azurewebsites.net')
        .constant('HASHBANG', '!')
        
        // end this with a trailing slash
        .constant('FIREBASE_URL', 'https://matigeni.firebaseio.com/')
        .constant('DEFAULT_HINTS', [
                    {
                        image: 'img/matigeni.jpg',
                        title: 'Matigeni',
                        text: 'Matigeni is a simple game of location guessing. We feature locations on earth that were damaged because of human error.' 
                    },{
                        image: 'img/awareness.jpg',
                        title: 'Raise Awareness',
                        text: 'We try to get people\'s awareness about man made disasters that were happening on earth. But, NOT the conventional way.'  
                    },{
                        image: 'img/spaceapps.png',
                        title: 'NASA SpaceApps Challenge Project',
                        text: 'We are one of the projects submitted for NASA Space Apps Challenge in 2014.' 
                    }
                ])

        .config(function($logProvider) {
            // uncomment to enable dev logging in the app
            $logProvider.debugEnabled && $logProvider.debugEnabled(true);
        })
;