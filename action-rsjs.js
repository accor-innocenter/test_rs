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

        var mqtt = require('mqtt');

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
            sayClient.end();
            resolve(message);
        });


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

                    flow.continue('AccorInnovationCenter:Yes ', (msg, flow) => {
                        console.log(JSON.stringify(msg))

                        const aux = msg.slots.find(slot => slot.slotName === 'Dessert');
                        this.Dessert = aux.value.value;


                        // End the session
                        flow.end();

                        return "Très bien, votre commande arrivera dans 20 minutes"

                    });
                    flow.continue('AccorInnovationCenter:None ', (msg, flow) => {
                        console.log(JSON.stringify(msg))

                        const aux = msg.slots.find(slot => slot.slotName === 'Dessert');
                        this.Dessert = aux.value.value;


                        // End the session
                        flow.end();

                        return "Ok, j'annule tout. N'hésitez pas à me redemander."

                    });

                    var resume = "";
                    if (FirstDish !== "None") resume += "en entrée " + FirstDish + ", ";
                    if (SecondDish !== "None") resume += "en plat principal " + SecondDish + ", ";
                    if (Dessert !== "None") resume += "et en dessert " + Dessert + ". ";

                    if (Dessert !== "None") {
                        return msg.slots[0].value.value + " est une spécialité de la maison. On a " + resume + "Ceci est correct?";

                    } else {
                        return "On a " + resume + "Ceci est correct?";

                    }

                });

                return msg.slots[0].value.value + ", parfait. Et quel dessert souhaitez-vous déguster?"

            });

            return msg.slots[0].value.value + ", excellent choix. Quel sera votre plat principal?"

        });


        // Use text to speech
        /*
        sayTTS("Voici le menu sur l'écran.", "fr")
            .then((data) => {
                console.log("C'est bon: " + data);

                //SHOW MENU ON SCREEN
                const fetchPromise = fetch(server + "domotics/menu");
                fetchPromise.then(response => {

                }).then(data => {
                    setTimeout(() => {
                        sayTTS("Que désirez-vous comme entrée?", "fr")
                    }, 5000);
                });


            });
            */

        setTimeout(() => {
            return "Que desirz-vous comme entrée?";
        }, 5000);

    })
})