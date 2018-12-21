
	var socket = null;

	/* Get User Media */
	var my_stream = null;

	// We'll use a global variable to hold on to our id from PeerJS
	var peer_id = null;
	var peernames = ['sergio', 'agatha'];
	var peer = null;
	var remotePeer = false;
	var remoteStream;
	var clientList;

	// Constraints - what do we want?
	let constraints = { audio: false, video: true }

	window.addEventListener('load', function() {
		// Prompt the user for permission, get the stream
		navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
			/* Use the stream */

			// // Attach to our video object
			var videoElement = document.getElementById('myvideo');
			videoElement.srcObject = stream;

			// Global for stream
			my_stream = stream;

			// Wait for the stream to load enough to play
			videoElement.onloadedmetadata = function(e) {
				videoElement.play();
				connectPeer();
			};
		})
		.catch(function(err) {
			/* Handle the error */
			alert(err);
		});
	});
	function connectPeer() {
        peer = new Peer({host: 'ra2548-2.itp.io', port: 9000, path: '/'});
		// Get an ID from the PeerJS server
		peer.on('open', function(id) {
			console.log('My peer ID is: ' + id);
			peer_id = id;

			// receive/send peerIds from other clients
			sockets = io.connect();
			var message = peer_id;
			var sendId = function(message) {
				console.log("peerId: " + message);
				sockets.emit('peerId', message);
			};
			sendId(message);
			sockets.on('peerId', function (clients) {
				console.log("somebody connected, received new list of clients: " + clients)
				clientList = clients;
			});
		});


		// peer server part, update list of clients if they are not available anymore	
		// output of error function as indicator, if peer cannot connect to peer, list gets modified and sent out to all clients  
		peer.on('error', function(err) {
			let logError = err.toString();
			console.log(logError);
			for (var i = 0; i < clientList.length; i++){
				if (logError.includes(clientList[i]) == true){
					clientList.splice(i, 1);
					sockets = io.connect();
					var message = clientList;
					var updateList = function(message) {
						sockets.emit('updatedClientList', message);
					};
					updateList(message)
					//console.log(clientList);
					if (clientList.length > 1) {
						console.log("connecting to peer")
						connectToPeer();
					} else {
						document.getElementById('mainHeader').innerHTML = "no peers to connect to, sorry :("
					};
				};
			};
		});

		peer.on('call', function(incoming_call) {
			console.log("Got a call!");
			console.log(incoming_call);
			incoming_call.answer(my_stream); // Answer the call with our stream from getUserMedia
			incoming_call.on('stream', function peerStream(l_remoteStream) {  // we receive a getUserMedia stream from the remote caller
				// And attach it to a video object
				remoteStream = l_remoteStream;
				var ovideoElement = document.createElement('video');
				ovideoElement.src = window.URL.createObjectURL(l_remoteStream) || l_remoteStream;
				ovideoElement.setAttribute("autoplay", "true");
				//ovideoElement.setAttribute("id", "remoteVideo");
				var peerStream = true;
				ovideoElement.play();
				document.body.appendChild(ovideoElement);

			});
		});
		var btn = document.querySelector('button');
		btn.onclick = connectToPeer; //run random selection on button click
		function connectToPeer() {
			//get a random number to select a random client from array
			function randomPeer() {
				function getRandomNumber(min, max) {
				   let random_number = Math.random() * (max-min) + min;
				    return Math.floor(random_number);
				}
				var randInt = getRandomNumber(0, (clientList.length));
				streamingPeer = clientList[randInt];
				if (streamingPeer == peer_id) {
					randomPeer();
				};
			};
			randomPeer();
			// call the selected client
			// var idToCall = document.getElementById('tocall').value;
			//console.log("peer: " + peer);
			var call = peer.call(streamingPeer, my_stream);
			console.log("made a call to this random peer: " + streamingPeer);

			call.on('stream', function(l_remoteStream) {
				remoteStream = l_remoteStream;
				console.log("Got remote stream");
				var ovideoElement = document.createElement('video');
				ovideoElement.src = window.URL.createObjectURL(l_remoteStream) || l_remoteStream;
				ovideoElement.setAttribute("id", "remoteStream")
				ovideoElement.setAttribute("autoplay", "true");
				var peerStream = true;
				ovideoElement.play();
				document.body.appendChild(ovideoElement);
				remotePeer = true;
			});

		}
	}
