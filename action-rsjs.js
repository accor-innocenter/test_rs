#! /usr/bin/env node


const { withHermes } = require('hermes-javascript');
const fetch = require("node-fetch");
//const mqtt = require('mqtt');
//const client = mqtt.connect('mqtt://localhost:1883');

//Server adress
const server = "http://192.168.86.76:1880/";

//Variables for the dishes
var FirstDish = "";
var SecondDish = "";
var Dessert = "";


function sayTTS(msg, lang) {

    return new Promise((resolve) => {

        console.log("sayTTS called");

        var sayClient = mqtt.connect('mqtt://localhost:1883');

        sayClient.publish('hermes/tts/say', JSON.stringify({
            "text": msg,
            "lang": lang,
            "siteId": "default"
        }));

        var finished = sayClient.subscribe('hermes/tts/sayFinished');
        sayClient.on('message', (topic, message) => {
            console.log(topic);
            console.log(message);
            sayClient.unsubscribe('hermes/tts/sayFinished');
            resolve(message);
        });


    });

}

function Send(msg, lang) {

    var mqtt = require('mqtt');

    var client = mqtt.connect()

    client.on('connect', function() {

        client.publish('hermes/tts/say', JSON.stringify({
            "text": msg,
            "lang": lang,
            "siteId": "default"
        }));


        client.end();
    });

}

withHermes(async hermes => {
    // Instantiate a dialog object
    const dialog = hermes.dialog()


    // Subscribes to intent 'myIntent'
    dialog.flow('AccorInnovationCenter:OrderRS', async(msg, flow) => {
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




                    // End the session
                    flow.end();


                    return msg.slots[0].value.value + " est une spécialité de la maison. Très bien, votre commande arrivera dans 20 minutes."


                });

                return msg.slots[0].value.value + ", parfait. Et quel dessert souhaitez-vous déguster?"

            });

            return msg.slots[0].value.value + ", excellent choix. Quel sera votre plat principal?"

        });


        //SHOW MENU ON SCREEN
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

                sayTTS("Deuxième message à la suite", "fr")
                    .then((data) => {
                        console.log("C'est bon 2e: " + data);
                        setTimeout(function() {
                            sayTTS("Troisième message 5 secondes après.")
                        }, 5000)
                    })

            });


        return true;

    })
})