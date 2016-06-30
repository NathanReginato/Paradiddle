//Set up consts

angular.module('paradiddle', [])
.controller('main', function($scope) {
//Get audio context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

//Get user media object
navigator.getUserMedia = (navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia);

  //Get animation context
  const canvas = document.getElementById('canvas');
  const canvasCtx = canvas.getContext("2d");

  let intendedWidth = document.querySelector('body').clientWidth;

  canvas.setAttribute('width',intendedWidth);

  //Set up oscillator
  const oscillator = audioCtx.createOscillator();

  //Set up gain node
  const gainNode = audioCtx.createGain();

  //Set up silencer node
  const silencer = audioCtx.createGain();

  //Set up analizer
  const analyser = audioCtx.createAnalyser();

  //Set up other variables
  let source;
  let stream;

  //Set browser frame rate
  let cycles;

  //Set smaple array
  let sampleArray = []

  //Set canvas varibles
  let HEIGHT = canvas.height
  let WIDTH = canvas.width

  //Set up view varibales
  $scope.bars = 2;
  $scope.volume = 0.1;
  $scope.beats = 4
  let beats = 4
  let divided_beats = beats + 1
  let spaced_bars = WIDTH / divided_beats
  let wave_pixel = 0.3
  let canvas_slicer = 0.02
  let bar_y = 0;
  let b_width = 1;
  let sound = false;
  let count = spaced_bars / 2
  let end = WIDTH - spaced_bars / 2

  //Set up audio input
  $scope.showit = false
  //Settings
  $scope.showsettings = function() {
    $scope.showit = !$scope.showit
  }

  //Check if getUserMedia is supported
  if (navigator.getUserMedia) {
    console.log('getUserMedia supported.');

    //If supported
    navigator.getUserMedia ({audio: true}, streamCallback, errorCallback)

    // Success callback
    function streamCallback(stream) {
      //Set up audio streams

      //define audio stream
      microphone = audioCtx.createMediaStreamSource(stream);


      //Pipe 1

      //Pipe user input to audio analyser
      microphone.connect(analyser);

      //Pipe analyser to silencer
      analyser.connect(silencer)

      //Pipe silencer to destination
      silencer.connect(audioCtx.destination)

      //Pipe 2

      //Pipe oscillator to gain node
      oscillator.connect(gainNode)

      //Pipe gain to destination
      gainNode.connect(audioCtx.destination);

      //set gain and silencer
      gainNode.gain.value = 0;
      silencer.gain.value = 0;

      //start oscillator set properties
      oscillator.start(0);
      oscillator.frequency.value = 440
    }

    // Error callback
    function errorCallback(err) {
      console.log('The following gUM error occured: ' + err);
    }

    // If not supported
  } else {
    console.log('getUserMedia not supported on your browser!');
  }

  //Set up animation loop
  function loop() {

    //Set up buffer array for input data
    analyser.fftSize = 1024;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);



    for (var i = 1; i < divided_beats; i++) {
      canvasCtx.fillRect(spaced_bars * i, bar_y, b_width, HEIGHT)
    }
    //Set up iterator function
    function iterator() {

      if (count < end) {

        analyser.getByteTimeDomainData(dataArray);

        for (let i = 0; i < bufferLength; i++) {
          canvasCtx.fillRect(count,dataArray[i],wave_pixel,wave_pixel)
          count += canvas_slicer


          for (var j = 1; j < divided_beats; j++) {
            if (count > (spaced_bars * j) && count < (spaced_bars * j) + 90) {
              sound = true
              break
            } else {
              sound  = false
            }
          }

          if (sound) {
            gainNode.gain.value = $scope.volume
          } else {
            gainNode.gain.value = 0
          }
        }
        console.log(dataArray);
        requestAnimationFrame(iterator);
      } else {
        if ($scope.bars > 1) {
          canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
          count = spaced_bars / 2
          $scope.bars--
          loop()
        } else {
          canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
          count = spaced_bars / 2
          $scope.bars = 2
          //Some finishing function
        }
      }
    }
    iterator()
  }


  // Set up function for sample sound data
  //Create function
  function sample() {

    //Set up buffer array for input data
    analyser.fftSize = 1024;
    let bufferLength = analyser.fftSize;
    let dataArray = new Uint8Array(bufferLength);

    let count = 0

    //Set up sample size
    let sampleSize = 25

    for (var i = 1; i < divided_beats; i++) {
      canvasCtx.fillRect(spaced_bars * i, bar_y, b_width, HEIGHT)
    }


    //Make iterator function
    function iterator() {

      if (count < WIDTH) {

        analyser.getByteTimeDomainData(dataArray);

        for (let i = 0; i < bufferLength; i++) {

          //Test user input against bars
          for (var j = 1; j < divided_beats; j++) {
            // if ((count > (spaced_bars * j) - sampleSize) && count < (spaced_bars * j) + sampleSize) {
            canvasCtx.fillRect(count,dataArray[i],wave_pixel,wave_pixel)
            // }
          }

          for (var j = 1; j < divided_beats; j++) {
            if (count > (spaced_bars * j) && count < (spaced_bars * j) + 90) {
              sound = true
              break
            } else {
              sound  = false
            }
          }

          if (sound) {
            gainNode.gain.value = $scope.volume
          } else {
            gainNode.gain.value = 0
          }

          count += canvas_slicer
        }


        requestAnimationFrame(iterator)


      } else {
        console.log(sampleArray);
      }

    }
    iterator()

  }

  //Get cpu cycles
  function getSpeed() {

  }

  function countOff() {

    let countDown = beats
    let countPrev = false
    //Set up buffer array for input data
    analyser.fftSize = 1024;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

    for (var i = 1; i < divided_beats; i++) {
      canvasCtx.fillRect(spaced_bars * i, bar_y, b_width, HEIGHT)
    }
    //Set up iterator function
    function iterator() {

      if (count < end) {

        analyser.getByteTimeDomainData(dataArray);

        for (let i = 0; i < bufferLength; i++) {
          count += canvas_slicer

          for (var j = 1; j < divided_beats; j++) {
            if (count > (spaced_bars * j) && count < (spaced_bars * j) + 90) {
              sound = true
              break
            } else {
              sound  = false
            }
          }

          if (sound) {
            gainNode.gain.value = $scope.volume
          } else {
            gainNode.gain.value = 0
          }
        }


        if (countPrev === false && sound === true) {
          myBtn.innerHTML = countDown
          countDown--
        }
        countPrev = sound

        requestAnimationFrame(iterator);
      } else {
        myBtn.innerHTML = 'Start'
        count = spaced_bars / 2;
        loop()
      }
    }
    iterator()
  }


  var myBtn = document.getElementById('start');

  //add event listener
  myBtn.addEventListener('click', function(event) {
    countOff()
  });



  })


  // sample()
  //Draw metronome bars and sound waves
  // canvasCtx.fillRect(10, 10, 10, 10);

  //Draw bars
  //draw waves
