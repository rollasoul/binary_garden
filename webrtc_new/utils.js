////////////////////////////////////////////////////////////////////////
// rewrite and modification of tensorflow person-segmentation masking//
//////////////////////////////////////////////////////////////////////

// major code sources:
// *https://github.com/tensorflow/tfjs-models/tree/master/person-segmentation
// *https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Manipulating_video_using_canvas


var outputStride = 16;
var flipHorizontal = false;
var segmentationThreshold = 0.5;
const canvas1 = document.getElementById('output1');
var ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('output2');
var ctx2 = canvas2.getContext('2d');
const canvasF = document.getElementById('stream');
var ctxF = canvasF.getContext('2d');
var canvasCode = document.getElementById('canvasCode');
var contextCode = canvasCode.getContext('2d');
var canvasBase = document.getElementById('canvasBase');
var contextBase = canvasBase.getContext('2d');
var canvasTransparent = document.getElementById('canvasTransparent');
var contextTransparent = canvasTransparent.getContext('2d');
const videoWidth = 640;
const videoHeight = 740;
var segmentation = 0;

// The video element on the page to display the webcam
let video = document.getElementById('thevideo');


//hide canvas feeds at start
document.getElementById('thevideo').style.display = 'none';
document.getElementById('myvideo').style.display = 'none';
document.getElementById('output1').style.display = 'none';
document.getElementById('output2').style.display = 'none';
document.getElementById('stream').style.display = 'none';
document.getElementById('canvasCode').style.display = 'none';
document.getElementById('canvasBase').style.display = 'none';
document.getElementById('canvasF').style.display = 'none';
// Constraints - what do we want?
let constraints1 = { audio: false, video: true }

// Prompt the user for permission, get the stream
function drawMe() {
navigator.mediaDevices.getUserMedia(constraints1).then(function(stream) {
    video.width = videoWidth;
    video.height = videoHeight;
    video.srcObject = stream;
    video.onloadedmetadata = function(e) {
            video.play();
            runModel();
    };
})
.catch(function(err) {
    alert(err);
});
};
//drawMe();
//wait for new my_stream
// Prompt the user for permission, get the stream

async function drawOnStream(){
    pollfn();
    //drawMe();
    // run the model once the vid is loaded
}
drawOnStream();

function pollfn() {
    setTimeout(function () {
        if (remotePeer == true) {
            console.log("got Peeeeeer stream");
            document.getElementById('remoteStream').style.display = 'none';
            //switch button text and button / input location
            document.getElementById('mainHeader').style.display = 'none';
            //var element = document.getElementById("connectElement");
            //element.innerHTML = "<br>" + "peer " + streamingPeer + " is streaming through me";
            document.getElementById('canvasBase').style.display = 'inline';
            document.getElementById('stream').style.display = 'inline';
            document.getElementById('canvasTransparent').style.display = 'inline';
            document.getElementById('streamBanner').innerHTML = "<br>" + "peer " + streamingPeer + "<br>" + " is streaming through me" + "<br>" + "* * *";
            //document.getElementById('connectButton').style.display = 'grid-column: 1';
            //document.getElementById('connectButton').innerHTML = "switch code streams";
            function fade_inCode(contextToFade, fadeInSpeed) {
                contextToFade.globalAlpha = 0.0
                setInterval(function () {
                    if (contextToFade.globalAlpha <= 1) {
                        contextToFade.globalAlpha += fadeInSpeed;
                    };
                }, 200);
            };
            fade_inCode(contextCode, 0.005);
            //fade_inCode(ctxF, 0.01);
            //element.appendChild(element.firstElementChild);
            drawPeer();
        } else {
            pollfn()
        };
    }, 2000);
};

// function pollfn() {
//     if (remotePeer == true) {
//         console.log("got Peeeeeer stream");
//         break
//     } else {
//         setTimeout(pollfn(), 4000)
//     };
// };

function drawPeer() {
    video.width = videoWidth;
    video.height = videoHeight;
    video.srcObject = remoteStream;
    video.onloadedmetadata = function(e) {
            video.play();
            runModel();
    };
};

//preload the personSegmentation from prediction to speed up process
var loaded = personSegmentation.load();
WebFont.load({
  google: {
    families: ['Cutive Mono']
  }
});

// mask the video feed based on segmentation data
async function maskVideo(segmentation) {
    // do the standard masking on the local user video
    ctx1.drawImage(video, 0, 0, videoWidth, videoHeight);

    // manipulate pixels of local user video
    // mask person
    //ctx1.globalAlpha = 0.1;
    let frame = ctx1.getImageData(0, 0, videoWidth, videoHeight);
    let l = frame.data.length/4;
    //create array of image data
    for (let i = 0; i < l; i++) {
        if (segmentation[i] == 1) {
            //draw video mask
            frame.data[i*4] = 0;
            frame.data[i*4 + 1] = 0;
            frame.data[i*4 + 2] = 0;
            frame.data[i*4 + 3] = 0;
        }
    }
    // write newImage (segmentation) on canvas2
    ctx2.putImageData(frame, 0, 0);

    // get video from remote stream, draw it on canvasBase
    let videoRemote = document.getElementById('remoteStream');
    contextBase.drawImage(videoRemote, 0, 0, videoWidth, videoHeight);

    // here is where the magic happens:
    // convert canvasBase(our former remote Stream) into Base64 code, clear the code-canvas(contextCode), write Base64 to code-canvas
    var dataUrl = canvasBase.toDataURL();
    var lines = dataUrl.split('/');
    contextCode.clearRect(0, 0, 640, 740);
    ctxF.clearRect(0, 0, 640, 740);
    contextCode.font = "28px Cutive Mono";
    canvasCode.fillStyle = "233,78,119";
    //contextCode.fillStyle = 'blue';
    for (var i = 0; i<lines.length; i++)
        contextCode.fillText(lines[i], 0, 0 + (i*8) );
    //draw canvas2 (segmentation mask) on canvasF (finalcanvas), take pixel data (Base64 code) from code-canvas(remote Stream)
    let frameF = ctx2.getImageData(0, 0, videoWidth, videoHeight);
    let lF = frameF.data.length/4;
    // let frameB = contextBase.getImageData(0, 0, videoWidth, videoHeight);
    // let lB = frameB.data.length/4;
    let frameC = contextCode.getImageData(0, 0, 640, 740);
    let lC = frameC.data.length/4;

    for (let i = 0; i < lC; i++) {
        if (segmentation[i] == 1) {
            //draw silhoutte in white with code floating through
            frameF.data[i*4] = frameC.data[i*4];
            frameF.data[i*4 + 1] = frameC.data[i*4 + 1];
            frameF.data[i*4 + 2] = frameC.data[i*4 + 2];
            frameF.data[i*4 + 3] = frameC.data[i*4 + 3];
        };
        // if (segmentation[i] == 1) {
        //     //draw mask with green background
        //     frameF.data[i*4] = frameF.data[i];
        //     frameF.data[i*4 + 1] = frameF.data[i*4 + 1];
        //     frameF.data[i*4 + 2] = frameF.data[i*4 + 2];
        //     frameF.data[i*4 + 3] = frameF.data[i*4 + 3];
        // }
        if (segmentation[i] == 0) {
            //draw green background
            // frameF.data[i*4] = 0;
            // frameF.data[i*4 + 1] = 230;
            // frameF.data[i*4 + 2] = 20;
            // frameF.data[i*4 + 3] = 100;

            // draw mask a little bit to the right - creates the local stream as shadow
            if (i <= 200) {
                frameF.data[i*4 + 0] = 198;
                frameF.data[i*4 + 1] = 229;
                frameF.data[i*4 + 2] = 217;
                frameF.data[i*4 + 3] = 255;
            } else {
                // frameF.data[i*4 + 0] = frameB.data[i*4 + 0];
                // frameF.data[i*4 + 1] = frameB.data[i*4 + 1];
                // frameF.data[i*4 + 2] = frameB.data[i*4 + 2];
                // frameF.data[i*4 + 3] = frameB.data[i*4 + 3];
            };
            frameF.data[i*4 + 104] = 198;
            frameF.data[i*4 + 105] = 229;
            frameF.data[i*4 + 106] = 217;
            frameF.data[i*4 + 107] = 255;
        };
    };
    ctxF.putImageData(frameF, 0, 0);
    contextBase.putImageData(frameF,0, 0)
    contextTransparent.putImageData(frameC,0, 0)
};


// main function in cascade-mode
async function runModel() {
    loaded.then(function(net){
    console.log("got model, running model");
      return net.estimatePersonSegmentation(video, flipHorizontal, 8, segmentationThreshold)
  }).then(function(segmentation){
      maskVideo(segmentation);
      // loops the function in a browser-sustainable way
      requestAnimationFrame(runModel);
    });
}
