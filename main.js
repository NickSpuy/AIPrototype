let brain = require('brain.js');
let dataRequest = new XMLHttpRequest()
let weatherRequest = new XMLHttpRequest()

dataRequest.open('GET', 'https://opendata.cbs.nl/ODataApi/OData/83497NED/UntypedDataSet', true)
dataRequest.onload = function() {

    weatherRequest.open('GET', 'http://weerlive.nl/api/json-data-10min.php?key=a2254cf217&locatie=Rotterdam', true)
    weatherRequest.onload = function() {  
        let weatherData = JSON.parse(weatherRequest.response)  
        let data = JSON.parse(dataRequest.response)
        let weatherTypeAPI = weatherData.liveweer[0].d0weer;
        let voertuig
        let trainingData = []

        console.log(weatherTypeAPI)
        
        if(weatherTypeAPI == "zonnig" || "helderenacht") {
            curWeather = 0;
        } else if(weatherTypeAPI == "bewolkt" || "halfbewolkt" || "zwaarbewolkt" || "wolkennacht") {
            curWeather = 1;
        } else if(weatherTypeAPI == "buien" || "regen" || "bliksem") {
            curWeather = 2;
        } else if(weatherTypeAPI == "sneeuw" || "hagel" ) {
            curWeather = 3;
        } else if (weatherTypeAPI == "mist" || "nachtmist") {
            curWeather = 4;
        }
    
        const config = {
            iterations: 20000,
            errorThresh: 0.005,
            log: true,
            logPeriode: 10,
            learningRate: 0.3,
            momentum: 0.1,
            callback: null,
            callbackPeriod: 10,
            timeout: Infinity
        };
    
        let net = new brain.NeuralNetwork(config);
    
        function runAI(dataDis, dataOut) {
            trainingData.push({input: {distance: dataDis}, output: [dataOut]})
        }
            
        data.value.forEach(travels => {
            let reisMethode = travels.Vervoerwijzen
            if (curWeather == 2 || curWeather == 3) {
                if(reisMethode !== "T001093" && reisMethode !== "A018986"){
                    if(reisMethode == "A018979" || reisMethode == "A018980"){
                        voertuig = 0 // Auto
                    } else if(reisMethode == "A018981") {
                        voertuig = 0.5 // Trein
                    } else if(reisMethode =="A018982") {
                        voertuig = 1 // Tram, Metro of Bus
                    }
                    runAI(travels.Reizigerskilometers_1, voertuig)
                }
            } else {
                if(reisMethode !== "T001093" && reisMethode !== "A018986"){
                    if(reisMethode == "A018979" || reisMethode == "A018980"){
                        voertuig = 0 // Auto
                    } else if(reisMethode == "A018981") {
                        voertuig = 0.2 // Trein
                    } else if(reisMethode =="A018982") {
                        voertuig = 0.4 // Tram, Metro of Bus
                    } else if(reisMethode == "A018983") {
                        voertuig = 0.6 // Felyx (brom- of snorfiets)
                    } else if(reisMethode == "A018984") {
                        voertuig = 0.8 // Fiets
                    } else if(reisMethode == "A01895") {
                        voertuig = 1 // Lopen
                    }
                    runAI(travels.Reizigerskilometers_1, voertuig)
                }
            }
        })
        net.train(trainingData);
    
        const output = net.run({distance: 25});
        let num = output[0].toFixed(3);
        console.log(num)

        let counts = [0, 0.2, 0.4, 0.6, 0.8, 1],
        goal = num;

        let closest = counts.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
        });

        console.log(closest);

        let splicer = counts.indexOf(closest)

        counts.splice(splicer, 1)

        let secondClosest = counts.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
        });

        console.log(secondClosest)

        let secondSplicer = counts.indexOf(secondClosest)

        counts.splice(secondSplicer, 1)

        let thirdClosest = counts.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
        });

        console.log(thirdClosest)

        if (closest == 0) {
            transport = "You should take the Car!"
        } else if (closest == 0.2) {
            transport = "You should take the Train!"
        } else if (closest == 0.4) {
            transport = "You should take the Metro, Tram or Bus!"
        } else if (closest == 0.6) {
            transport = "You should take the Felyx!"
        } else if (closest == 0.8) {
            transport = "You should take the Bike!"
        } else if (closest == 1) {
            transport = "You should Walk!"
        }

        let div = document.createElement('div');
        div.innerHTML = transport;
        document.body.appendChild(div);
    }
    weatherRequest.send()
}
dataRequest.send()