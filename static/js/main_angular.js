(function() {

    var app = angular.module('moduleChar', ['communicationServer', 'ui.bootstrap', 'ngCookies','ngRoute','mySearchModule']);
    
    /* Config the view to render on link click */
    app.config(['$routeProvider', '$locationProvider',
        function($routeProvider, $locationProvider) {
            $routeProvider

                .when('/Sources', {
                    templateUrl: 'sources.html'
                });
    
            // configure html5 to get links working on jsfiddle
            $locationProvider.html5Mode(true);
        }
    ]);
    
    /* Service for all things related to th emain char [char set displayed] */
    app.factory('MainChar', ['$cookieStore',
        function($cookieStore) {

            var lang = {
                tw: {
                    init: {
                        char: '字',
                        mandarin: 'zi'
                    },
                    country: 'tw',
                    index: 0,
                    langtable: 'TAIWANESE',
                    url: 'http://upload.wikimedia.org/wikipedia/commons/7/72/Flag_of_the_Republic_of_China.svg'
                },
                cn: {
                    init: {
                        char: '字',
                        mandarin: 'zi'
                    },
                    country: 'cn',
                    index: 1,
                    langtable: 'CHINESE',
                    url: 'http://upload.wikimedia.org/wikipedia/commons/f/fa/Flag_of_the_People%27s_Republic_of_China.svg'
                },
                jp: {
                    init: {
                        char: '字',
                        romaji: 'ji'
                    },
                    country: 'jp',
                    index: 2,
                    langtable: 'JAPANESE',
                    url: 'http://upload.wikimedia.org/wikipedia/commons/9/9e/Flag_of_Japan.svg'
                }
            };
            
/*            if($cookieStore.get('pastCouples')) {
                var logs = $cookieStore.get('pastCouples').log;
                if (logs.length > 0) {
                    Query.queryOneChar({
                        //Need to withdraw 1 to get the last element [indexed on 0]
                        lang: logs[logs.length - 1].lang,
                        id: logs[logs.length - 1].id
                    });
                }
            }*/

            var charactersData = {
                currentChar: {
                    tw: lang.tw.init,
                    cn: lang.cn.init,
                    jp: lang.jp.init
                },
                currentLanguage: 'tw',
                currentIndex: 0
            };

            charactersData.char = charactersData.currentChar[charactersData.currentLanguage].char;


            function setCurrentLanguage(language) {
                charactersData.currentLanguage = language;
                charactersData.currentIndex = lang[language].index;
            }

            function setCurrentChar(char) {
                charactersData.currentChar = char;
            }


            function updateChar(params) {

                /* Retrieve the correcting character from the language in the char set */
                var tempChar = charactersData.currentChar[charactersData.currentLanguage];
                /* If the char exists in the language */
                if (tempChar) {
                    charactersData.char = tempChar.char;
                    charactersData.pron = (charactersData.currentLanguage == 'jp' ? tempChar.romaji : tempChar.mandarin);
                }
                /* If no char; placeholder */
                else {
                    charactersData.char = '∅';
                    charactersData.pron = '';
                }
            }


            /* Record in a cookie every past couple (row_id, lang) */
            function recordLog() {

                var params = {};
                params.lang = charactersData.currentLanguage;
                params.id = charactersData.currentChar[params.lang]._id;

                //$cookieStore.remove('pastCouples');
                var tempPast = $cookieStore.get('pastCouples');

                //If no defined cookies, initialize storing array
                if (!tempPast) {
                    tempPast = {};
                }
                if (!(tempPast.log)) {
                    tempPast.log = [];
                }
                //Set a limit to 20 characters
                if (tempPast.log.length > 20) {
                    tempPast.log.shift();
                }
                var tempsLogs = tempPast.log;
                tempsLogs.push(params);
                $cookieStore.put('pastCouples', {
                    log: tempsLogs
                });

            }

            return {
                getCurrentChar: function() {
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
                lang: lang

            };
        }
    ]);

    app.controller('infoCtrl', ['$scope', 'MainChar', '$cookieStore',
        function($scope, MainChar, $cookieStore) {

            $scope.isHidden = false;

            $scope.char_info2 = 'test';

            $scope.charactersData = MainChar.getCurrentChar();

            $scope.getActiveCountry = function() {
                return $scope.charactersData;
            };

            $scope.toggleInfo = function() {
                $scope.isHidden = !$scope.isHidden;
                console.log($cookieStore.get('pastChars'));
            };


        }
    ]);

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

    /** Controller handling all the work in the search bar */
    app.controller('searchBarCtrl', ['$scope', 'Search', 'Query', 'MainChar',
        function($scope, Search, Query, MainChar) {

            $scope.submitted = function(input) {
                Search.requestSearch(input);
            };

            $scope.onSelected = function() {
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

            $scope.foundcharsobj = Search.getFoundChar();

            $scope.inputObj = Search.getInputObj();

            $scope.getInput = function(input) {

                //$scope.chars=input.split('');

                //Need at least one character ot be input
                /*if (input.length>0){
                    
                    // Get the last character input only
                    RequestServer.emit('search for char',input.slice(-1));
                }*/
            };



        }
    ]);

    app.directive('myCharInfo', ['MainChar',
        function(MainChar) {

            var templateRootPath = '/html/infos/';

            //var country=MainChar.getCurrentChar().country;

            return {
                restrict: 'E',
                templateUrl: function(tElem, tAttrs) {

                    var country = tAttrs.activeCountry.currentLanguage;

                    return templateRootPath + ((country == 'cn') ? 'charinfocn.html' : 'charinfo.html');
                }
            };

        }
    ]);

    app.controller('charCtrl', ['$scope', 'Query', 'MainChar', '$cookieStore',
        function($scope, Query, MainChar, $cookieStore) {

            /* Get the current char from the factory MainChar */
            $scope.charactersData = MainChar.getCurrentChar();
            
            //Ask for a new char 
            $scope.getData = function() {
                var queryParams = {
                    lang: $scope.charactersData.currentLanguage
                };
                Query.queryOneChar(queryParams);
            };
            
            //Ask for the previous char, taking its coordinates from cookies
            //->Would not work offline, store qll infos in cookies?
            $scope.prevData = function() {
                var mlogs = $cookieStore.get('pastCouples');
                var logs = mlogs.log;
                if (logs.length > 1) {
                    
                    logs.pop();
                
                    Query.queryOneChar({
                        //Need to withdraw 1 to get the last element [indexed on 0]
                        lang: logs[logs.length - 1].lang,
                        id: logs[logs.length - 1].id
                    });
                    
                    logs.pop();
                    $cookieStore.put('pastCouples', {
                        log: logs
                    });
                
                }

            };

        }
    ]);

    /* Controller for the flag board */
    app.controller('flagboardCtrl', ['$scope', 'MainChar',
        function($scope, MainChar) {

            var currentChar = MainChar.getCurrentChar();

            $scope.isSelected = currentChar;

            $scope.switchLanguage = function(flagcountry) {
                MainChar.setCurrentLanguage(flagcountry);
            };

        }
    ]);

    /**
     * Directive returning the flagboard
     */
    app.directive('flagBoard', ['MainChar',
        function(MainChar) {

            var flags = [MainChar.lang.tw, MainChar.lang.cn, MainChar.lang.jp];

            function isSelected() {
                return true;
            }

            var templateHtml = "<table><tr>";
            flags.forEach(function(flag, index) {
                templateHtml += ("<td><img src=" + flag.url + " countryname=" + flag.country + " ng-class={'selectedFlag':active==" + index + "}></td>");
            });
            templateHtml += "</tr></table>";
            return {
                restrict: 'E',
                scope: {
                    onflagclick: '&',
                    active: '@'
                },
                template: templateHtml,
                link: function(scope, element, attrs) {

                    if (attrs.onflagclick) {

                        var imgs = element.find("img");
                        for (var i = 0; i < imgs.length; i++) {
                            //In case of dynamic, bind the function

                            angular.element(imgs[i]).bind('click', function() {

                                //Need to define an object holding the param to pass it to our scope method
                                var arg = {
                                    param: angular.element(this).attr('countryname')
                                };
                                //Call the controller function and apply the changes
                                scope.$apply(scope.onflagclick(arg));
                            });

                        }
                    }


                }
            };

        }
    ]);


})();
