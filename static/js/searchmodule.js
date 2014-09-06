(function () {
    
    var app = angular.module('mySearchModule',['communicationServer']);
    
    
     /* Service to request a char [search function] */
    app.factory('Search', ['Socket',
        function(Socket) {

            /** Search object wrapping all 'export' properties' */
            var searchObj = {
                list: '',
                returned: true
            };

            /** Input object wrapping export properties */
            var inputObj = {
                split: ''
            };

            /** Regex for all roman characters, including with accent */
            var regexSearch = /[a-zA-Z0-9áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸ]+/;

            function isOneChar(char) {
                if (char.length == 1 || regexSearch.test(char)) {
                    return true;
                }
                else if (char.length > 1 && !regexSearch.test(char)) {
                    inputObj.split = char.slice(-1);
                    return false;
                }
                else {
                    return false;
                }
            }

            Socket.on('got search list', function(data) {
                searchObj.list = data;
                searchObj.returned = true;
            });

            return {
                requestSearch: function(input) {
                    if (isOneChar(input)) {
                        searchObj.returned = false;
                        Socket.emit('search for char', input);
                    }
                },
                getFoundChar: function() {
                    return searchObj;
                },
                getInputObj: function() {
                    return inputObj;
                }

            };

        }
    ]);
    
    /* Directive for the search bar */
    app.directive('mySearchBar',function (){
       return{
           restrict:'AE',
           templateUrl:'/html/searchbar/searchindex.html',
           
       }; 
    });
    
    
    
})();