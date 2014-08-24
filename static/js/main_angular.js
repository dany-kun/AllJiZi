(function() {

    var app = angular.module('moduleChar', ['communicationServer','ui.bootstrap','ngCookies']);
    
    /* Service for all things related to th emain char [char set displayed] */
    app.factory('MainChar', ['$cookieStore',function($cookieStore) {
        
        var lang = {
            tw: {
                init: {
                    char: '字',
                    mandarin: 'zi'
                },
                country:'tw',
                index: 0,
                langtable: 'TAIWANESE',
                url: 'http://upload.wikimedia.org/wikipedia/commons/7/72/Flag_of_the_Republic_of_China.svg'
            },
            cn: {
                init: {
                    char: '字',
                    mandarin: 'zi'
                },
                country:'cn',
                index: 1,
                langtable: 'CHINESE',
                url: 'http://upload.wikimedia.org/wikipedia/commons/f/fa/Flag_of_the_People%27s_Republic_of_China.svg'
            },
            jp: {
                init: {
                    char: '字',
                    romaji: 'ji'
                },
                country:'jp',
                index: 2,
                langtable: 'JAPANESE',
                url: 'http://upload.wikimedia.org/wikipedia/commons/9/9e/Flag_of_Japan.svg'
            }
        };
        
        var charactersData = {
            currentChar: {tw:lang.tw.init, cn:lang.cn.init,jp:lang.jp.init},
            currentLanguage: 'tw',
            currentIndex:0
        };
        
        charactersData.char=charactersData.currentChar[charactersData.currentLanguage].char;
        
        
        function setCurrentLanguage(language){
            charactersData.currentLanguage = language;
            charactersData.currentIndex = lang[language].index;
        }
        
        function setCurrentChar(char){
            charactersData.currentChar = char;
        }
        
        
        function updateChar(params) {
            
            /* Retrieve the correcting character from the language in the char set */
            var tempChar = charactersData.currentChar[charactersData.currentLanguage];
            /* If the char exists in the language */
            if (tempChar) {
                charactersData.char = tempChar.char;
                charactersData.pron=(charactersData.currentLanguage=='jp'?tempChar.romaji :tempChar.mandarin);
            }
            /* If no char; placeholder */
            else {
                charactersData.char = '\u2205';
                charactersData.pron='';
            }
        }
        
        
        /* Record in a cookie every past couple (row_id, lang) */
        function recordLog(){
            
            var params={};
            params.lang=charactersData.currentLanguage;
            params.id=charactersData.currentChar[params.lang]._id;
            
            //$cookieStore.remove('pastCouples');
            var tempPast=$cookieStore.get('pastCouples');
            
            //If no defined cookies, initialize storing array
            if (!tempPast){
                tempPast={};
            }
            if (!(tempPast.log)){
                tempPast.log=[];
            }
            //Set a limit to 20 characters
            if (tempPast.log.length>20){
                tempPast.log.shift();
            }
            var tempsLogs=tempPast.log;
            tempsLogs.push(params);
            $cookieStore.put('pastCouples',{log:tempsLogs});
            
        }
        
        return {
            getCurrentChar: function (){
                return charactersData;
            },
            setCurrentChar: function(newchar) {
                setCurrentChar(newchar);
                updateChar();
                recordLog();
            },
            setCurrentLanguage: function(country) {
                setCurrentLanguage(country);
                updateChar();
            },
            lang:lang
        
        };
    }]);

    app.controller('infoCtrl', ['$scope', 'MainChar','$cookieStore',function($scope,MainChar,$cookieStore) {
        
        $scope.isHidden = false;
        
        $scope.char_info2='test';
        
        $scope.charactersData=MainChar.getCurrentChar();
        
        $scope.getActiveCountry=function() {
            return $scope.charactersData;
        };
        
        $scope.toggleInfo = function() {
            $scope.isHidden = !$scope.isHidden;
            console.log($cookieStore.get('pastChars'));
        };


    }]);
    
    app.factory('Query', ['Socket', 'MainChar',
        function(RequestServer, MainChar) {

            /*Function called when data was received by the client from the server */
            var callbackSetCurrentChar = function(data) {
                MainChar.setCurrentChar(data);
            };

            var typeReq = RequestServer.name;

            if (typeReq == 'Socket') {
                /* When a new char set is received from the server, set it in the MainChar factory*/
                RequestServer.on('got new char', function(data) {
                    callbackSetCurrentChar(data);
                });
            }
            
            /* params is a couple lang/id */
            function getData(params) {
                
                console.log(params +'++');

                /* In case the request is through socket */
                if (typeReq == 'Socket') {

                    /* Ask a new char set to the server */
                    RequestServer.emit('getNewChar', params);

                }

                /* In case the request is through regular Http Get */
                if (typeReq == 'HttpGet') {

                    /* Ask a new char set to the server */
                    RequestServer.getCharFromHttp(params, function(data) {
                        callbackSetCurrentChar(data);
                    });
                }

            }
            return {
                queryOneChar: function(params) {
                    getData(params);
                }
            };
        }
    ]);
    
    /* Service to request a char [search function] */
    app.factory('Search', ['Socket', 
        function(Socket) {

            /** Search object wrapping all 'export' properties' */
            var searchObj={list:'',returned:true};
            
            /** Input object wrapping export properties */
            var inputObj={split:''};
            
            /** Regex for all roman characters, including with accent */
            var regexSearch=/[a-zA-Z0-9áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸ]+/;

            function isOneChar(char) {
                if (char.length==1 || regexSearch.test(char)){
                    return true;
                }
                else if (char.length>1 && !regexSearch.test(char)) {
                    inputObj.split=char.slice(-1);
                    return false;
                }
                else {
                    return false;
                }
            }

            Socket.on('got search list', function(data) {
                searchObj.list=data;
                searchObj.returned=true;
            });

            return {
                requestSearch: function(input) {
                    if (isOneChar(input)) {
                        searchObj.returned=false;
                        Socket.emit('search for char', input);
                    }
                },
                getFoundChar:function(){
                    return searchObj;
                },
                getInputObj:function(){
                    return inputObj;
                }
                
            };

        }
    ]);
    
    /** Controller handling all the work in the search bar */
    app.controller('searchBarCtrl',['$scope','Search','Query','MainChar',function($scope,Search, Query,MainChar) {
        
        $scope.submitted=function(input){
                Search.requestSearch(input);
        };
        
        $scope.onSelected=function(){
            var mlang;
            switch ($scope.selectedChar.LANGTABLE) {
                case 'CHINESE':
                    mlang = 'cn';
                    break;
                case 'JAPANESE':
                    mlang = 'jp';
                    break;
                default:
                    mlang = 'tw';
            }
            
            MainChar.setCurrentLanguage(mlang);
            
            var params = {
                lang: mlang,
                id: $scope.selectedChar._id
            };
            
            Query.queryOneChar(params);
            
        };
        
        $scope.foundcharsobj=Search.getFoundChar();
        
        $scope.inputObj=Search.getInputObj();

        $scope.getInput=function(input) {
            
            //$scope.chars=input.split('');
            
            //Need at least one character ot be input
            /*if (input.length>0){
                
                // Get the last character input only
                RequestServer.emit('search for char',input.slice(-1));
            }*/
        };
        
        
        
    }]);
    
    app.directive('myCharInfo',['MainChar',function(MainChar){
        
        var templateRootPath='/html/infos/';
        
        //var country=MainChar.getCurrentChar().country;
        
        return{
            restrict:'E' ,
            templateUrl:function(tElem,tAttrs){
                
                var country=tAttrs.activeCountry.currentLanguage;
                
                return templateRootPath + ((country=='cn')? 'charinfocn.html':'charinfo.html');
            }
        };
        
    }]);

    app.controller('charCtrl', ['$scope', 'Query', 'MainChar', '$cookieStore',
        function($scope, Query, MainChar, $cookieStore) {

            /* Get the current char from the factory MainChar */
            $scope.charactersData = MainChar.getCurrentChar();

            $scope.getData = function() {
                var queryParams = {
                    lang: $scope.charactersData.currentLanguage
                };
                Query.queryOneChar(queryParams);
            };

            $scope.prevData = function() {
                var mlogs=$cookieStore.get('pastCouples');
                console.log(mlogs);
                var logs=mlogs.log;
                Query.queryOneChar({lang:logs[logs.length-2].lang, id:logs[logs.length-2].id});
                logs.slice(-2,2);
                $cookieStore.put('pastCouples', {log:logs});

            };

        }
    ]);
    
    /* Controller for the flag board */
    app.controller('flagboardCtrl',['$scope','MainChar',function($scope,MainChar){
        
        /* Need an array for ng-repeat orderBy */
        $scope.flags=[MainChar.lang.tw,MainChar.lang.cn,MainChar.lang.jp];
        
        var currentChar=MainChar.getCurrentChar();
        
        $scope.isSelected=currentChar;
        
        $scope.test='eee';
        
        $scope.switchLanguage=function(index,flag){
            MainChar.setCurrentLanguage(flag.country);
        };
        
    }]);
    
    /**Directive returning the flagboard
     *
     */
    app.directive('flagBoard', ['MainChar',
                function(MainChar) {


                    var flags = [MainChar.lang.tw, MainChar.lang.cn, MainChar.lang.jp];

                    var templateHtml = "<table><tr>";
                    flags.forEach(function(flag) {
                        templateHtml += ("<td><img src=" + flag.url + " name=" + flag.country + "></td>");
                    });
                    templateHtml += "</tr></table>";

                    return {
                        restrict: 'E',
                        scope: {
                            ppp: '@'
                        },
                        template: "{{ppp}}" + templateHtml,
                        link: function(scope, element, attrs) {
                            //In case of static flags
                            //Look for active flag attribute
                            if (attrs.active) {
                                var imgs = element.find("img");
                                for (var i = 0; i < imgs.length; i++) {
                                    if (imgs[i].name == attrs.active) {
                                        //Apply css on active flag
                                        angular.element(imgs[i]).addClass('selectedFlag');
                                    }
                                }
                            }
                        }
                    };
        
    }]);
    

})();
