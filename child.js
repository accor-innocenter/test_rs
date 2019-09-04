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




//MAKE SNIPS ASK A QUESTION AND LISTEN TO USER FEEDBACK (CATCH INTENT OUTSIDE)
function actionTTS(msg, lang) {

    return new Promise((resolve) => {

        console.log("actionTTS launched");

        var actClient = client;

        actClient.publish('hermes/dialogueManager/startSession', JSON.stringify({
            "init": {
                "type": "action",
                "text": msg
            }
        }));

        console.log("publish sent");

        listenIntent('#').then((data) => {
            resolve(data);
        })

    });

}



//LISTEN & RETURN INTENTS IN PROMISE
function listenIntent(intent) {

    return new Promise((resolve) => {

        var catchIntents = client.subscribe('hermes/intent/' + intent);
        client.on('message', (topic, message) => {
            console.log(topic);
            console.log(JSON.parse(message.toString()));
            //client.unsubscribe('hermes/intent/'+intent);
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
function webRequest(webreq) {

    return new Promise((resolve, reject) => {
        const fetchPromise = fetch(server + webreq);

        fetchPromise.then(response => {
            //console.log("@@@@@@@@@@@@@@@@@@@@@@@");
            //console.log(response);
        }).then(data => {
            //console.log("@@@@@@@@@@@@@@@@@@@@@@@");
            //console.log(data);
            resolve(data);
        }).catch((error) => {
            reject(error);
        });

    });
}

//LAUNCH WEB REQUEST TO NODE-RED SERVER
function webRequestPOST(webreq, mydata) {

    return new Promise((resolve, reject) => {
        const fetchPromise = fetch(server + webreq, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'no-cors', // no-cors, cors, *same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json',
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // no-referrer, *client
            body: JSON.stringify(mydata), // body data type must match "Content-Type" header
        });

        fetchPromise.then(response => {
            //console.log("@@@@@@@@@@@@@@@@@@@@@@@");
            //console.log(response.json());
        }).then(data => {
            //console.log("@@@@@@@@@@@@@@@@@@@@@@@");
            //console.log(data);
            resolve(data);
        }).catch((error) => {
            reject(error);
        });

    });
}





//EXIT FUNCTION KILLS CHILD PROCESS (RELAUNCHED BY PARENT)
function myExit(topic) {
    if (topic === "hermes/intent/AccorInnovationCenter:Exit") {
        sayTTS("Ok, on annule tout.", "fr").then(function() {
            process.exit()
            console.log("exit now");
            throw new Error();
        }).catch();


    }
}







//MAIN FUNCTION
withHermes(async hermes => {

    const dialog = hermes.dialog();

    listenIntent('AccorInnovationCenter:OrderRS').then(async(data) => {

        webRequest('/domotics/roomservice');
        await sayTTS("Voici le menu. Vous pouvez annuler à tout moment en disant: Quitter la comande. Je vous laisse quelques secondes pour choisir.", "fr").then().catch();

        await myWait(5).then().catch();

        await actionTTS("Quelle entrée souhaitez-vous?", "fr")
            .catch()
            .then(async(data) => {

                //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                //console.log(data);

                var acknowledgement = "";

                if (data.topic === "hermes/intent/AccorInnovationCenter:FirstCourse") {
                    FirstDish = data.message.slots[0].value.value;
                    acknowledgement = FirstDish + ", un excellent choix. ";
                } else if (data.topic === "hermes/intent/AccorInnovationCenter:None") {
                    FirstDish = "";
                    acknowledgement = "Très bien. "
                }
                myExit(data.topic);

                await sayTTS(acknowledgement, "fr").then().catch();
                //await myWait(0.5).then().catch();

                await actionTTS("Quel sera votre plat principal?", "fr")
                    .catch()
                    .then(async(data) => {

                        //console.log(data);

                        var acknowledgement = "";

                        if (data.topic === "hermes/intent/AccorInnovationCenter:SecondCourse") {
                            SecondDish = data.message.slots[0].value.value;
                            acknowledgement = SecondDish + " c'est une spécialité de la maison.";
                        } else if (data.topic === "hermes/intent/AccorInnovationCenter:None") {
                            SecondDish = "";
                            acknowledgement = "Pas de plat principal? Ok."
                        }
                        myExit(data.topic);

                        await sayTTS(acknowledgement, "fr").then().catch();
                        //await myWait(0.5).then().catch();



                        await actionTTS("Et finallement comme dessert?", "fr")
                            .catch()
                            .then(async(data) => {

                                //console.log(data);

                                var acknowledgement = "";

                                if (data.topic === "hermes/intent/AccorInnovationCenter:Dessert") {
                                    Dessert = data.message.slots[0].value.value;
                                    acknowledgement = Dessert + ", excellent.";
                                } else if (data.topic === "hermes/intent/AccorInnovationCenter:None") {
                                    Dessert = "";
                                    acknowledgement = "Pas de dessert."
                                }
                                myExit(data.topic);

                                await sayTTS(acknowledgement, "fr").then().catch();
                                //await myWait(1).then().catch();

                            });




                        var result = "En résumé, on a";
                        if (FirstDish !== "") {
                            result += FirstDish + " en entrée, puis ";
                        } else {
                            result += " aucune entrée, ";
                        }

                        if (SecondDish !== "") {
                            result += "comme plat principal " + SecondDish + ", et "
                        } else {
                            result += " pas de plat principal, ";
                        }

                        if (Dessert !== "") {
                            result += "finalement " + Dessert + " pour dessert."
                        } else {
                            result += " aucun dessert. ";
                        }

                        await sayTTS(result, "fr").then().catch();
                        //await myWait(1).then().catch();

                        await actionTTS("C'est correct?", "fr")
                            .catch()
                            .then(async(data) => {

                                //console.log(data);

                                if (data.topic === "hermes/intent/AccorInnovationCenter:Yes") {

                                    await sayTTS("Parfait, votre commande arrivera dans 20 minutes. Bonne dégustation!", "fr");


                                    await myWait(3).then().catch();


                                    await webRequestPOST("https://maker.ifttt.com/trigger/PushRich/with/key/c6h_lSARLyhKpzYEyNPt7STZGaW4knm53pc3Ur_BKR-", {
                                        value1: "Votre commande arrive dans une minute!"
                                    }).then().catch();

                                    process.exit();


                                } else if (data.topic === "hermes/intent/AccorInnovationCenter:None") {

                                    await sayTTS("Ok, on annule. N'hésitez pas à refaire une demande.", "fr");
                                    process.exit()


                                }

                            });

                    });

            });

    })

})