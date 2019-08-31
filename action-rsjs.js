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

//MAKE SNIPS SAY SOMETHING (WITHOUT USER FEEDBACK)
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

//MAKE SNIPS ASK A QUESTION AND LISTEN TO USER FEEDBACK
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

//LISTEN & CATCH INTENTS IN PROMISE
function listenIntent(intent) {

    return new Promise((resolve) => {

        var catchIntents = client.subscribe('hermes/intent/'+intent);
        client.on('message', (topic, message) => {
            console.log(topic);
            console.log(JSON.parse(message.toString()));
            client.unsubscribe('hermes/intent/#');
            resolve({
                "topic": topic,
                "message": JSON.parse(message.toString())
            });
        });


    });
}

//SIMPLE WAIT FUNCTION ENCAPSULATED IN PROMISE
function myWait(timeSec) {

    return new Promise((resolve) => {

        setTimeout(() => {
            resolve(true);
        }, timeSec * 1000);


    });

}

//LAUNCH WEB REQUEST TO NODE-RED SERVER
function webRequest(webreq){

    return new Promise((resolve,reject) => {
        const fetchPromise = fetch(server + webreq);
        
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

    listenIntent('AccorInnovationCenter:Exit').then(async (data)=> {
        process.exit()
        console.log("exit now");
        throw new Error();
    });

    listenIntent('AccorInnovationCenter:OrderRS').then(async (data)=> {

        webRequest('/domotics/menu');
        await sayTTS("Voici le menu.","fr").then().catch();

        await myWait(5).then().catch();

        await actionTTS("Quelle entrée souhaitez-vous?", "fr")
        .catch()
        .then(async (data)=>{

            //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
            //console.log(data);

            var acknowledgement = "";

            if (data.topic==="hermes/intent/AccorInnovationCenter:FirstCourse") {
                FirstDish=data.message.slots[0].value.value;
                acknowledgement = FirstDish + ", un excellent choix... ";
            }
            else if (data.topic==="hermes/intent/AccorInnovationCenter:None") {
                FirstDish="";
                acknowledgement = "Très bien... "
            }

            await sayTTS(acknowledgement, "fr").then().catch();
            await myWait(1).then().catch();

            await actionTTS("Quel sera votre plat principal?", "fr")
            .catch()
            .then(async (data)=>{

                //console.log(data);

                var acknowledgement = "";

                if (data.topic==="hermes/intent/AccorInnovationCenter:SecondCourse") {
                    SecondDish=data.message.slots[0].value.value;
                    acknowledgement = SecondDish + " c'est une spécialité de la maison.";
                }
                else if (data.topic==="hermes/intent/AccorInnovationCenter:None") {
                    SecondDish="";
                    acknowledgement = "Pas de plat principal? Ok."
                }

                await sayTTS(acknowledgement, "fr").then().catch();
                await myWait(1).then().catch();



                await actionTTS("Et finallement comme dessert?", "fr")
                .catch()
                .then(async (data)=>{

                    //console.log(data);

                    var acknowledgement = "";

                    if (data.topic==="hermes/intent/AccorInnovationCenter:Dessert") {
                        Dessert=data.message.slots[0].value.value;
                        acknowledgement = Dessert + ", excellent.";
                    }
                    else if (data.topic==="hermes/intent/AccorInnovationCenter:None") {
                        Dessert="";
                        acknowledgement = "Pas de dessert."
                    }

                    await sayTTS(acknowledgement, "fr").then().catch();
                    await myWait(1).then().catch();

                });




                var result = "En résumé, on a...";
                if (FirstDish!=="") {
                    result += FirstDish + " en entrée, puis ";
                }
                else {
                    result += " aucune entrée, ";
                }

                if (SecondDish!=="") {
                    result += "comme plat principal " + SecondDish + ", et "
                }
                else {
                    result += " pas de plat principal, ";
                }

                if (Dessert!=="") {
                    result += "finalement " + Dessert + " pour dessert."
                }
                else {
                    result += " aucun dessert. ";
                }

                await sayTTS(result, "fr").then().catch();
                await myWait(1).then().catch();

                await actionTTS("C'est correct?", "fr")
                .catch()
                .then(async (data)=>{

                    //console.log(data);

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