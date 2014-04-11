
angular.module('myApp.config', [])
        .constant('version', '0.9.1')

        .constant('WEBURL', 'http://matigeni.azurewebsites.net')
        .constant('HASHBANG', '!')
        
        // end this with a trailing slash
        .constant('FIREBASE_URL', 'https://matigeni.firebaseio.com/')
        .config(function($logProvider) {
            // uncomment to enable dev logging in the app
            $logProvider.debugEnabled && $logProvider.debugEnabled(true);
        })
;