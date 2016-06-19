/* globals __dirname */
var _ = require('lodash');
var PATH = require('path');
var http = require('http');
var express = require('express');
var context = require('./context');
var config = context.Configuration;

// Connect/Express middleware
var body_parser = require('body-parser');
var compression = require('compression');
var errorhandler = require('errorhandler');
var method_override = require('method-override');
var cookie_parser = require('cookie-parser');
var multer = require('multer');
var cors = require('cors');

var app = express();

// Configuration
app.use(compression());
app.use(cookie_parser());
app.use(method_override());
app.use(body_parser.urlencoded({ extended: true })); // x-www-form-urlencoded
app.use(body_parser.json()); // raw, with application/json
app.use(multer().any()); // form-data
app.use(express.static(PATH.join(__dirname, 'static')));

// set the view engine to ejs
app.set('views', PATH.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// CORS
!!config.cors ? app.use(cors(config.cors)) : app.use(cors());

// Session
// var Session = require('./api/framework/Session');
// var session = Session.create();
// app.use(session);
// var Identity = require('./api/framework/Identity');
// var identity = Identity.create(); 
// app.use(identity);

// Routes
var ControllerRouter = require('@irysius/anguli-components').ControllerRouter;
var controllerRouter = ControllerRouter({ express: express });
controllerRouter.setup(app, __dirname + '/api');

// Rest of the routes
app.use(function (req, res, next) {
	res.status(404).json({ error: 'Not found' });
});
app.use(errorhandler({ dumpExceptions: true, showStack: true }));

// Start the server
var httpServer = http.createServer(app);
httpServer.on('listening', function () {
	console.log('server listening on port: ' + httpServer.address().port);
});

// Socket Endpoints
// var io = require('socket.io')(httpServer);
// var hubRouter = require('./api/framework/HubRouter');
// hubRouter.filter(io);
// hubRouter.setup(io, __dirname + '/api');

httpServer.listen(settings.port);

