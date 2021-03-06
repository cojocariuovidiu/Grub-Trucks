require('./location');
var mongoose = require('mongoose');
var dbName = 'Loc8r';
var dbURI = 'mongodb://127.0.0.1/Loc8r';

if (process.env.NODE_ENV === 'production') {
    dbURI = process.env.MONGODB_URI;
}

mongoose.connect(dbURI).catch(function (error) {
    console.log(error); 
});   

mongoose.connection.on('connected', function () {
    console.log('Mongoose connected to: ' + dbURI);
});

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connected error: ' + error);
});

mongoose.connection.on('disconnected', function () {
    console.log('Mongoose disconnected');
});


var gracefulShutdown = function (msg, callback) {
    mongoose.connection.close(function () {
        console.log('Mongoose disconnected through: ' + msg);
        callback();
    });
}

//For nodemon restarts
process.once('SIGUSR2', function () {
    gracefulShutdown('nodemon restart', function () {
        process.kill(process.pid, 'SIGUSR2')
    });
});

//For app termination
process.once('SIGINT', function () {
    gracefulShutdown('app termination', function () {
        process.exit(0);
    });
});

//For heroku termination
process.once('SIGTERM', function () {
    gracefulShutdown('Heroku app shutdown', function () {
        process.exit(0);
    });
});