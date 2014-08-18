var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require("cookie-parser");
var session = require("express-session");
var path = require('path');
var io = require('socket.io');

/**Own module to initialize and load all parameters relative to a language */
var mylanguages = require("mlanguages");
/**Own module to get the search query */
var searchquery=require("search-query");

var dbquery=require("dbquery");

var appExpress = express();

//var file = "static/db/characters.db";



mylanguages.init(function(err, mlanguages) {
    
    appExpress.use(bodyParser());
    appExpress.use(express.static(path.resolve(__dirname, 'static')));
    appExpress.use(cookieParser('S3CRE7'));
    appExpress.use(session());


    io = io.listen(appExpress.listen(process.env.PORT, process.env.IP));

    appExpress.get('/', function(req, res) {

        console.log(req.query);

        req.session.char = false;

        res.render('index.html');

    });

    /*appExpress.get('/chars/', function(req, res) {
        
        if (!!req.query){
            console.log('ask for char through http');
            var calling_language=req.query.calling_language;    
            newchar(calling_language,1200,function(data){
                    res.send(data);
            });
        }
    });

    //initializing the websockets communication , server instance has to be sent as the argument 
    */

    io.sockets.on("connection", function(socket) {
        /*Associating the callback function to be executed when client visits the page and
          websocket connection is made */

        console.log('io socket connected');


        //TODO: Need to optimize that!: same arguments given 3 times!
        //Params: object with 2 properties: 'lang': calling language and 'id': row id
        socket.on('getNewChar', function(params) {
            
            if (!params || !params.lang){
                console.log('Missing the lang properties in the querying object');
            }
            else {
            
                console.log('Asking a new char from ' + params.lang);
            
                // Return the object language/ tw,cn or jp
                var language = mlanguages[params.lang];
            
                // If no row id, get a random one from the indexes
                if (!params.id) {
                    var indexes = language.indexes;
                    params.id = indexes[Math.floor(Math.random() * indexes.length)];
                }
            
                //Open database
                dbquery.initReadOnly("assets/db/characters.db");
                // Query all the corresponding characters in all tables 
                dbquery.getNewSet(language, params.id, function(data) {
                    //Emit result to client
                    socket.emit('got new char', data);
                });
            }
        });
        
        
        // Searching for a set of char corresponding*/
        socket.on('search for char', function(char) {
            console.log('looking for ' + char + ' in the database');
            //Get instance of db
            dbquery.initReadOnly("assets/db/characters.db");
            dbquery.searchChar(searchquery.searchquery, '%' + char + '%', function(err, rows) {
                if (err) {
                    console.log(err);
                }
                else {
                    socket.emit('got search list', rows);
                }
            });
        });
    });

});