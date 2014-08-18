(function(){
    
    var commserver=angular.module('communicationServer',[]);
    
    commserver.factory('HttpGet',['$http', function($http){
        return {
            name:'HttpGet',
            
            getCharFromHttp: function(calling_language,callback) {
                console.log(calling_language);
                $http.get('/chars/',{params: {'calling_language':'taiwanese'}}).
                    success(function(data, status, headers, config) {
                        // this callback will be called asynchronously
                        // when the response is available
                        callback(data);
                }).
                    error(function(data, status, headers, config) {
                        console.log('error in result!');
                        console.log(data);
                });    
            }
        };
    }]);
    
    commserver.factory('Socket', function($rootScope) {

        var socket = io();

        return {
            name:'Socket',
            
            on: function(eventName, callback) {
                socket.on(eventName, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function(eventName, data, callback) {
                socket.emit(eventName, data, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }
        };
        

    });
    
})();