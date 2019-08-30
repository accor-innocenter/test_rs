#! /usr/bin/env node


const { withHermes } = require('hermes-javascript');
const fetch = require("node-fetch");
const mqtt = require('mqtt');

//Server adress
const server = "http://192.168.86.76:1880/";

//MQTT connection
var client = mqtt.connect('mqtt://localhost:1883')
client.on('connect', function() {
    client.subscribe('hermes/intent/CrystalMethod:hello')
})

//Variables for the dishes
var FirstDish = "";
var SecondDish = "";
var Dessert = "";


function sayTTS(msg, lang) {

    console.log("sayTTS called");
    const timeout = 15000;

    return new Promise(function(resolve, reject) {

        var sayClient = mqtt.connect('mqtt://localhost:1883');
        console.log("set mqtt");

        sayClient.on('connect', function() {
            console.log("mqtt connected");

            sayClient.publish('hermes/tts/say', JSON.stringify({
                "text": msg,
                "lang": lang,
                "siteId": "default",

            }));


            var finished = sayClient.subscribe('hermes/tts/sayFinished');
            sayClient.on('message', function(topic, message) {
                console.log(topic);
                console.log(message);
                sayClient.unsubscribe('hermes/tts/sayFinished');
                resolve(message);
            });
            setTimeout(() => {
                reject("timeout");
            }, timeout)
        });
    });

}


withHermes(hermes => {
    // Instantiate a dialog object
    const dialog = hermes.dialog()


    // Subscribes to intent 'myIntent'
    dialog.flow('AccorInnovationCenter:OrderRS', (msg, flow) => {
        // Log intent message
        console.log(JSON.stringify(msg))


        flow.continue('AccorInnovationCenter:FirstCourse', (msg, flow) => {
            console.log(JSON.stringify(msg));

            const aux = msg.slots.find(slot => slot.slotName === 'Dish1');
            this.FirstDish = aux.value.value;

            flow.continue('AccorInnovationCenter:SecondCourse', (msg, flow) => {
                console.log(JSON.stringify(msg))

                const aux = msg.slots.find(slot => slot.slotName === 'Dish2');
                this.SecondDish = aux.value.value;


                flow.continue('AccorInnovationCenter:Dessert', (msg, flow) => {
                    console.log(JSON.stringify(msg))

                    const aux = msg.slots.find(slot => slot.slotName === 'Dessert');
                    this.Dessert = aux.value.value;

                    /*
                    let url = server + "domotics/fitness";
                    var payload = { };
                    var data = new FormData();
                    data.append( "json", JSON.stringify( payload ) );
                    fetch(url,
                    {
                        method: "GET",
                        body: data
                    })
                    .then((res)=>{ 
                        console.log("@@@@@@@@@@@@@@@@@@@@@@@");
                        console.log(res);
                    })
                    .then((data)=>{ 
                        console.log("@@@@@@@@@@@@@@@@@@@@@@@");
                        console.log(data);
                    })

*/
                    // End the session
                    flow.end();


                    return msg.slots[0].value.value + " est une spécialité de la maison. Très bien, votre commande arrivera dans 20 minutes."


                });

                return msg.slots[0].value.value + ", parfait. Et quel dessert souhaitez-vous déguster?"

            });

            return msg.slots[0].value.value + ", excellent choix. Quel sera votre plat principal?"

        });

        /*
                let url = server + "domotics/menu";
                var payload = { };
                var data = new FormData();
                data.append( "json", JSON.stringify( payload ) );
                fetch(url,
                {
                    method: "GET",
                    body: data
                })
                .then((res)=>{ 
                    console.log("@@@@@@@@@@@@@@@@@@@@@@@");
                    console.log(res);
                })
                .then((data)=>{ 
                    console.log("@@@@@@@@@@@@@@@@@@@@@@@");
                    console.log(data);
                })
        */

        const fetchPromise = fetch(server + "domotics/menu");
        fetchPromise.then(response => {
            console.log("@@@@@@@@@@@@@@@@@@@@@@@");
            console.log(response);
            return response.json();
        }).then(data => {
            console.log("@@@@@@@@@@@@@@@@@@@@@@@");
            console.log(data);
        });

        // Use text to speech

        flow.end();

        sayTTS("Ceci est un test de TTS", "fr")
            .then((data) => {
                console.log("C'est bon: " + data);

                sayTTS("Deuxième message à la suite", "fr").then((data) => {
                    console.log("C'est bon 2e: " + data);
                    setTimeout(function() {
                        sayTTS("Troisième message 5 secondes après.")
                    }, 5000)
                })

            })
            .catch((error) => {
                console.log("Erreur: " + error)
                return 'Il y a eu une erreur';
            })

    })
})