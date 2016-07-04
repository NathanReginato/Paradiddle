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


    //Set up catch for past canvas
    const container = document.getElementById('containers')
    let canvasCount = 1;

    function copyCanvas() {
      var temp = document.createElement("canvas");
      temp.setAttribute("id", "dest" + canvasCount);
      container.appendChild(temp);

      let dest = document.getElementById("dest" + canvasCount);
      let destCtx = dest.getContext('2d');
      dest.setAttribute('width',intendedWidth / 2);
      dest.setAttribute('height',HEIGHT / 2);
      destCtx.clearRect(0, 0, WIDTH, HEIGHT);
      destCtx.drawImage(canvas, 0, 0,WIDTH / 2, HEIGHT / 2);
      canvasCount++
    }

    //Set up view varibales
    $scope.bars = 10;
    $scope.volume = 0.1;
    $scope.beats = 32;
    $scope.tempo = 0.09

    function initialization() {



    let divided_beats = $scope.beats + 1
    let spaced_bars = WIDTH / divided_beats
    let wave_pixel = 0.3
    let canvas_slicer = $scope.tempo
    let bar_y = 0;
    let b_width = 1;
    let sound = false;
    let count = spaced_bars / 2
    let end = WIDTH - spaced_bars / 2

      countOff()


    //Set up animation loop
    function loop() {

      let lag = 10;
      let diff = 20;
      let influence = 0;
      let meanArray = [];
      let mean = HEIGHT / 2
      let savedPlot;
      let first = true
      let meanLength = 1000
      let peakArray = []
      let lastQualifyingPoint = 0
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

          for (let i = 1; i < bufferLength; i++) {


            //Only let one peak be drawn per bar

            //Peak analyser
            //Signal when plot point goes above mean + diff
            if (dataArray[i] < mean - diff) {
              if (lastQualifyingPoint > dataArray[i]) {
                canvasCtx.fillStyle = 'blue';
                canvasCtx.fillRect(count,lastQualifyingPoint,1,20)
                canvasCtx.fillStyle = 'black';

              } else {
                lastQualifyingPoint = dataArray[i]
                canvasCtx.fillRect(count,dataArray[i],1,1)
              }


            } else {
              if (dataArray[i] < HEIGHT / 2) {
                meanArray.unshift(dataArray[i])

                canvasCtx.fillStyle = 'red';
                canvasCtx.fillRect(count,mean,1,1)

                canvasCtx.fillStyle = 'black';
              }

              if (meanArray.length > meanLength) {
                meanArray.pop()
              }

              let meanSum = 0;

              for (var j = 0; j < meanArray.length; j++) {
                meanSum += meanArray[j]
              }

              mean = meanSum / meanArray.length
            }

            //Boring stuff


            canvasCtx.fillRect(count,dataArray[i],wave_pixel,wave_pixel)
            count += canvas_slicer


            for (var j = 1; j < divided_beats; j++) {
              if (count > (spaced_bars * j) && count < (spaced_bars * j) + spaced_bars / 2) {
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
          requestAnimationFrame(iterator);
        } else {
          copyCanvas()
          if ($scope.bars > 1) {
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
            count = spaced_bars / 2
            $scope.bars--
            loop()
          } else {
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
            count = spaced_bars / 2
            $scope.bars = 2
            canvasCount = 1;
            //Some finishing function
          }
        }
      }
      iterator()
    }

    function countOff() {

      let countDown = $scope.beats
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
              if (count > (spaced_bars * j) && count < (spaced_bars * j) + spaced_bars / 2) {
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
          myBtn.innerHTML = 'START'
          count = spaced_bars / 2;
          loop()
        }
      }
      iterator()
    }
}

    var myBtn = document.getElementById('start');

    //add event listener
    myBtn.addEventListener('click', function(event) {
      container.innerHTML = '';
      initialization()
    });



  })


  // sample()
  //Draw metronome bars and sound waves
  // canvasCtx.fillRect(10, 10, 10, 10);

  //Draw bars
  //draw waves
