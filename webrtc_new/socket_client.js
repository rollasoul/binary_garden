
	var socket = null;

	/* Get User Media */
	var my_stream = null;

	// We'll use a global variable to hold on to our id from PeerJS
	var peer_id = null;
	var peernames = ['sergio', 'agatha'];
	var peer = null;
	var remotePeer = false;
	var remoteStream;

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
			// canvasElement.onloadedmetadata = function(e) {
			// 	//canvasElement.play();
			// 	connectPeer();
			// };
		})
		.catch(function(err) {
			/* Handle the error */
			alert(err);
		});
	});
	function connectPeer() {
		// Register for an API Key:	http://peerjs.com/peerserver
		//var peer = new Peer({key: '7ifmum8rcw61or'});
		//peer = new Peer({host: '104.131.82.13', port: 9000, path: '/'});
                peer = new Peer({host: 'ra2548-2.itp.io', port: 9000, path: '/'});
		// Get an ID from the PeerJS server
		peer.on('open', function(id) {
			console.log('My peer ID is: ' + id);
			peer_id = id;

			socket = io.connect();

			socket.on('connect', function() {
				console.log("connect");
				socket.emit('peerid',peer_id);
			});

			socket.on('peerid',function(data) {
				//makeCall(data);
			});
		});

		peer.on('error', function(err) {
			console.log(err);
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
		btn.onclick = function() {
			var idToCall = document.getElementById('tocall').value;
			console.log("peer: " + peer);
			var call = peer.call(idToCall, my_stream);
			console.log("made a call: " + call);

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
