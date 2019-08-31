#! /usr/bin/env node


const { withHermes } = require('hermes-javascript');
const fetch = require("node-fetch");
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const { Enums } = require('hermes-javascript/types')


//Server adress
const server = "http://192.168.86.76:1880";

//Variables for the dishes
var FirstDish = "";
var SecondDish = "";
var Dessert = "";

var mySession = "";


function sayTTS(msg, lang) {

    return new Promise((resolve) => {

        var sayClient = client;

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

function notificationTTS(msg, lang) {

    return new Promise((resolve) => {

        var sayClient = client;

        sayClient.publish('hermes/dialogueManager/startSession', JSON.stringify({
            "init": 
                {
                    "type": "notification",
                    "text": msg
                }
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

function actionTTS(msg,lang) {

    return new Promise((resolve) => {

        console.log("actionTTS launched");

        var actClient = client;

        actClient.publish('hermes/dialogueManager/startSession', JSON.stringify({
            "init": 
                {
                    "type": "action",
                    "text": msg
                }
            }));

        console.log("publish sent");

        listenIntent('#').then((data)=>{
            resolve(data);
        })


    });

}

function listenIntent(intent) {

    return new Promise((resolve) => {

        var catchIntents = client.subscribe('hermes/intent/'+intent);
        client.on('message', (topic, message) => {
            console.log(topic);
            console.log(message);
            client.unsubscribe('hermes/intent/#');
            resolve({
                "topic": topic,
                "message": message
            });
        });


    });
}

function myWait(timeSec) {

    return new Promise((resolve) => {

        setTimeout(() => {
            resolve(true);
        }, timeSec * 1000);


    });

}

function castTV(webreq){

    return new Promise((resolve,reject) => {
        const fetchPromise = fetch(server + "domotics/menu");
        
        fetchPromise.then(response => {
            //console.log("@@@@@@@@@@@@@@@@@@@@@@@");
            //console.log(response);
        }).then(data => {
            //console.log("@@@@@@@@@@@@@@@@@@@@@@@");
            //console.log(data);
            resolve(data);
        }).catch((error)=>{
            reject(error);
        });

    });
}


withHermes(async hermes => {
    // Instantiate a dialog object
    const dialog = hermes.dialog()

    /*
    // Subscribes to intent 'myIntent'
    dialog.flow('AccorInnovationCenter:OrderRS', async(msg, flow) => {
        // Log intent message
        console.log(JSON.stringify(msg))
        
        mySession = msg.sessionId;

        flow.continue('AccorInnovationCenter:FirstCourse', (msg, flow) => {
            console.log(JSON.stringify(msg));

            this.FirstDish = msg.slots[0].value.value;
            console.log("first: " + FirstDish);

            flow.continue('AccorInnovationCenter:SecondCourse', (msg, flow) => {
                console.log(JSON.stringify(msg))

                this.SecondDish = msg.slots[0].value.value;
                console.log("second: " + SecondDish);

                flow.continue('AccorInnovationCenter:Dessert', (msg, flow) => {
                    console.log(JSON.stringify(msg))

                    this.Dessert = msg.slots[0].value.value
                    console.log("dessert: " + Dessert);

                    flow.continue('AccorInnovationCenter:Yes ', (msg, flow) => {
                        console.log(JSON.stringify(msg))

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


            flow.end();

            return msg.slots[0].value.value + ", excellent choix. Quel sera votre plat principal?"

        });

        await myWait(5).then().catch();

        //return "Que desirez-vous comme entrée?";

    })
    */

    listenIntent('AccorInnovationCenter:OrderRS').then(async (data)=> {

        await sayTTS("Voici le menu.","fr").then().catch();

        await myWait(10).then().catch();

        await actionTTS("Quelle entrée souhaitez-vous?", "fr")
        .then((data)=>{

            var acknowledgement = "";

            if (data.topic==="hermes/intent/AccorInnovationCenter:FirstCourse") {
                FirstDish=data.message.slot[0].value.value;
                acknowledgement = FirstDish + ", un excellent choix.";
            }
            else if (data.topic==="hermes/intent/AccorInnovationCenter:None") {
                FirstDish="";
                acknowledgement = "Très bien."
            }

            actionTTS(acknowledgement+"Quel sera votre plat principal?", "fr")
            .then(async (data)=>{

                var acknowledgement = "";

                if (data.topic==="hermes/intent/AccorInnovationCenter:SecondCourse") {
                    SecondDish=data.message.slot[0].value.value;
                    acknowledgement = FirstDish + " c'est une spécialité de la maison.";
                }
                else if (data.topic==="hermes/intent/AccorInnovationCenter:None") {
                    SecondDish="";
                    acknowledgement = "Pas de plat principal? Ok."
                }

                var result = "En résumé, on a: ";
                if (FirstDish!=="") {
                    result += FirstDish + " en entrée,"
                }
                if (SecondDish!=="") {
                    result += "comme plat principal " + SecondDish + ","
                }

                await sayTTS(result, "fr");

                actionTTS("C'est correct?", "fr")
                .then(async (data)=>{
                    if (data.topic==="hermes/intent/AccorInnovationCenter:Yes") {
                        
                        await sayTTS("Parfait, votre commande arrivera dans 20 minutes. Bonne dégustation!", "fr");
                        
                    }
                    else if (data.topic==="hermes/intent/AccorInnovationCenter:None") {
                        
                        await sayTTS("Ok, on annule. N'hésitez pas à refaire une demande.", "fr");

                    }

                });


            });



        });















    })



})