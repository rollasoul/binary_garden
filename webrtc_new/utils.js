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
const canvasF = document.getElementById('canvasF');
var ctxF = canvasF.getContext('2d');
var canvasCode = document.getElementById('canvasCode');
var contextCode = canvasCode.getContext('2d');
var canvasBase = document.getElementById('canvasBase');
var contextBase = canvasBase.getContext('2d');
const videoWidth = 640;
const videoHeight = 740;
var segmentation = 0;

// The video element on the page to display the webcam
let video = document.getElementById('thevideo');


//hide canvas feeds (except the final canvas outputB)
document.getElementById('thevideo').style.display = 'none';
document.getElementById('myvideo').style.display = 'none';
document.getElementById('output1').style.display = 'none';
document.getElementById('output2').style.display = 'none';
//document.getElementById('outputB').style.display = 'none';
document.getElementById('canvasCode').style.display = 'none';
document.getElementById('canvasBase').style.display = 'none';
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
            var element = document.getElementById("connectElement");
            element.innerHTML = "is streaming through me";
            //element.appendChild(element.firstElementChild);
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
    ctxF.globalAlpha = 0.9;
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
    void contextCode.clearRect(0, 0, 640, 740);
    for (var i = 0; i<lines.length; i++)
        contextCode.fillText(lines[i], 0, 0 + (i*8) );
        contextCode.font = "8px Cutive Mono";
    //draw canvas2 (segmentation mask) on canvasF (finalcanvas), take pixel data (Base64 code) from code-canvas(remote Stream)
    let frameF = ctx2.getImageData(0, 0, videoWidth, videoHeight);
    let lF = frameF.data.length/4;
    let frameC = contextCode.getImageData(0, 0, 640, 740);
    let lC = frameC.data.length/4;

    for (let i = 0; i < lC; i++) {
        if (segmentation[i] == 1) {
            //draw silhoutte in white with code floating through
            frameF.data[i*4] = frameC.data[i];
            frameF.data[i*4 + 1] = frameC.data[i*4 + 1];
            frameF.data[i*4 + 2] = frameC.data[i*4 + 2];
            frameF.data[i*4 + 3] = frameC.data[i*4 + 3];
        }
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
            frameF.data[i*4 + 99] = 50;
            frameF.data[i*4 + 100] = 200;
            frameF.data[i*4 + 101] = 100;
            frameF.data[i*4 + 102] = 130;
        }
    }
    ctxF.putImageData(frameF, 0, 0);
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
