//Set up consts

angular.module('paradiddle', ["chart.js"])
.config(['ChartJsProvider', function (ChartJsProvider) {
  // Configure all charts
  ChartJsProvider.setOptions({
    colours: ['#749C75','#44292A','#F4F6EF'],
    responsive: true
  });
  // Configure all line charts
  ChartJsProvider.setOptions('Line', {
    datasetFill: false
  });
}])
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
    analyser.fftSize = 32;

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
    $scope.bars = 2;
    $scope.volume = 0.1;
    $scope.beats = 3;
    $scope.tempo = 0.01;
    $scope.offset = 27;
    $scope.noiseThreshold = 20
    $scope.waveLength = 10
    $scope.toggleWaveForm = true;

    function initialization() {

      let divided_beats = $scope.beats + 1
      let spaced_bars = WIDTH / divided_beats
      let wave_pixel = 1
      let canvas_slicer = $scope.tempo
      let bar_y = 0;
      let b_width = 1;
      let sound = false;
      let count = spaced_bars / 2
      let end = WIDTH - spaced_bars / 2
      let waveWindow = $scope.waveLength;
      let plotsArray = [];
      let tempCount = []
      let countArray = [];
      let accuracy = 0;


      let diff = $scope.noiseThreshold;
      let meanArray = [];
      let meanLength = 40
      let mean = HEIGHT / 2

      countOff()


      //Set up animation loop
      function loop() {



        analyser.fftSize = 1024;
        let bufferLength = analyser.frequencyBinCount;
        let dataArray = new Uint8Array(bufferLength);



        for (var i = 1; i < divided_beats; i++) {
          canvasCtx.fillStyle = '#44292A';
          canvasCtx.fillRect(spaced_bars * i, bar_y, b_width, HEIGHT)
        }

        //Set up iterator function
        function iterator() {


          if (count < end) {

            analyser.getByteTimeDomainData(dataArray);

            for (let i = 1; i < bufferLength; i++) {

              if (dataArray[i] < mean - diff) {

                plotsArray.push(count)

              } else {
                if (count > plotsArray[plotsArray.length - 1] + waveWindow) {
                  canvasCtx.fillStyle = '#749C75';
                  tempCount.push(plotsArray[0] - $scope.offset)
                  canvasCtx.fillRect(plotsArray[0] - $scope.offset,0,1,HEIGHT)
                  plotsArray = [];
                }

                if (dataArray[i] < HEIGHT / 2) {
                  meanArray.unshift(dataArray[i])

                  if ($scope.toggleWaveForm) {
                    canvasCtx.fillStyle = 'purple';
                    canvasCtx.fillRect(count - $scope.offset,mean,1,1)
                    canvasCtx.fillStyle = '#44292A';
                  }

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

              if ($scope.toggleWaveForm) {
                canvasCtx.fillRect(count - $scope.offset,dataArray[i],wave_pixel,wave_pixel)
              }
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
            countArray.push(tempCount)
            tempCount = []
            if ($scope.bars > 1) {
              canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
              count = spaced_bars / 2
              $scope.bars--
              loop()
            } else {
              canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
              count = spaced_bars / 2
              $scope.bars = 4
              canvasCount = 1;
              calculate()
            }
          }
        }

        iterator()
      }

      let accuracyArr = []
      let zeros = []
      let chartLabels = []

      function calculate() {


        for (var i = 0; i < countArray.length; i++) {
          for (var j = 0; j < countArray[i].length; j++) {
            accuracyArr.push(countArray[i][j] - (spaced_bars * (j + 1)))
            zeros.push(0)
            chartLabels.push(`${i+1}.${j+1}`)
          }
        }

        console.log(chartLabels);

        $scope.labels = chartLabels;
        $scope.data = [
          accuracyArr,
          zeros
        ];
        $scope.$apply()

      }
      function countOff() {

        let countDown = $scope.beats
        let countPrev = false
        //Set up buffer array for input data
        analyser.fftSize = 1024;
        let bufferLength = analyser.frequencyBinCount;
        let dataArray = new Uint8Array(bufferLength);

        for (var i = 1; i < divided_beats; i++) {
          canvasCtx.fillStyle = '#44292A';
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



    $scope.series = ['Your time', 'Perfect time'];
    $scope.data = [
      [],
      []
    ];
    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };
    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
    $scope.options = {
      scales: {
        yAxes: [
          {
            id: 'y-axis-1',
            type: 'linear',
            display: true,
            position: 'left'
          },
          {
            id: 'y-axis-1',
            type: 'linear',
            display: true,
            position: 'left'
          }
        ]
      }
    };


  })
