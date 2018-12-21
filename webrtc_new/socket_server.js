// Use the http module: http://nodejs.org/api/http.html
var http = require('https');
var fs = require('fs');
var url =  require('url');

var options = {
  key: fs.readFileSync('/root/itp_io_cert/my-key.pem'),
  cert: fs.readFileSync('/root/itp_io_cert/my-cert.pem')
};


// http://nodejs.org/api/http.html#http_event_request
function handleIt(req, res) {
	console.log("The URL is: " + req.url);

	var parsedUrl = url.parse(req.url);
	console.log("They asked for " + parsedUrl.pathname);

	var path = parsedUrl.pathname;
	if (path == "/") {
		path = "webrtc.html";
	}

	fs.readFile(__dirname + path,

		// Callback function for reading
		function (err, fileContents) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + req.url);
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(fileContents);
  		}
  	);

	// Send a log message to the console
	console.log("Got a request " + req.url);
}



// Call the createServer method, passing in an anonymous callback function that will be called when a request is made
var httpServer = http.createServer(options, handleIt);

// Tell that server to listen on port 8001
httpServer.listen(8007);

console.log('Server listening on port 8007');

//////////////////////////


var clients = [];

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
	// We are given a websocket object in our function
	function (socket) {


        console.log("We have a new client: " + socket.id);

        // get peerIds from clients, send them around as list to all clients
        socket.on('peerId', function(message) {
            console.log("Received: 'peerId' " + message);
            clients.push(message);
            io.sockets.emit('peerId', clients);
        });
	
	//listen for updates from the clients, distribute updated list 
        socket.on('updatedClientList', function(nuList) {
            clients = nuList;
            io.sockets.emit('peerId', clients);
        });

	}
);
