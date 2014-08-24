var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require("cookie-parser");
var session = require("express-session");
var path = require('path');
var io = require('socket.io');

/*Own module to initialize and load all parameters relative to a language */
var mylanguages = require("mlanguages");
/*Own module to get the search query */
var searchquery = require("msearches");
/* Own module which communicate with the database */
var dbquery = require('mdbquery');

var appExpress = express();

var pathToDb = "assets/db/characters.db";


mylanguages.init(function(err, mlanguages) {

    /**
     * In case for whatever reasons we could not access database properties/queries/functionalities
     */
    if (err) {
        throw new Error('Could not get database properties');
    }

    /* Setting the server with Express module  */

    //appExpress.use(bodyParser());
    appExpress.use(express.static(path.resolve(__dirname, 'static')));

    //appExpress.use(cookieParser('S3CRE7'));
    appExpress.use(session());


    /** 
     * Setting the io socket connection
     */
    io = io.listen(appExpress.listen(process.env.PORT, process.env.IP));


    /* Initialization of socket */
    io.sockets.on("connection", function(socket) {

        console.log('io socket connected');


        /** Emit from client asking for a new char set (one character from calling_language 
         * and corresponding characters in the other languages
         * At the end, emit the object retrieved from database
         * Params: object with 2 properties: 'lang': calling language and 'id': row id
         * params = {
         *      lang: 'xxxx',
         *    id: 'dddd',
         *  ....}
         */
        socket.on('getNewChar', function(params) {

            //Check if params has the correct properties
            if (!params || !params.lang) {
                console.log('Missing the lang properties in the querying object');
            }
            else {
                // Return the object language/ tw,cn or jp
                var language = mlanguages[params.lang];

                // If no row id, get a random one from the indexes
                if (!params.id) {
                    var indexes = language.indexes;
                    params.id = indexes[Math.floor(Math.random() * indexes.length)];
                }

                //Open database
                dbquery.initReadOnly(pathToDb);
                // Query all the corresponding characters in all tables 
                dbquery.getNewSet(language, params.id, function(err, data) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        //Emit result to client
                        socket.emit('got new char', data);
                    }
                });
            }
        });


        /*Searching for a char and returning the corresponding characters (in all languages)*/
        socket.on('search for char', function(char) {
            console.log('looking for ' + char + ' in the database');
            //Get instance of db
            dbquery.initReadOnly(pathToDb);
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