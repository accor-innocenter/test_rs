#! /usr/bin/env node


const { withHermes } = require('hermes-javascript');
const fetch = require("node-fetch");
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const { Enums } = require('hermes-javascript/types')

const Store = require('data-store');
const store = new Store({ path: 'config.json' });

//Server adress
const server = "http://192.168.86.76:1880";

//Variables for the dishes
var FirstDish = "";
var SecondDish = "";
var Dessert = "";

var mySession = "";

var temp_cost = 0;
var rs_cost = 0;

if (store.hasOwn('rs_cost')) {
    rs_cost = store.get('rs_cost');
}

var topicNotif = "appNotif/appnotif"


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



//MAKE SNIPS SAY SOMETHING (WITHOUT USER FEEDBACK)
function sendNotifMQTT(msg, MQTT, IFTTT) {

    var sayClient = client;

    if (MQTT) {
        sayClient.publish(topicNotif, msg);
    }
    if (IFTTT) {
        webRequestDATA("https://maker.ifttt.com/trigger/PushRich/with/key/c6h_lSARLyhKpzYEyNPt7STZGaW4knm53pc3Ur_BKR-", {
            "value1": msg
        }).then().catch();
    }


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
        const fetchPromise = fetch(webreq);

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
function webRequestDATA(webreq, mydata) {

    return new Promise((resolve, reject) => {
        const fetchPromise = fetch(webreq, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/json',
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
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

    let _this = this;

    listenIntent('AccorInnovationCenter:OrderRS').then(async(data) => {

        if (data.topic === "hermes/intent/AccorInnovationCenter:OrderRS") {

            webRequest(server + '/domotics/roomservice');
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

                        if (FirstDish.toLowerCase().indexOf("tataki") !== -1) {
                            temp_cost += 4;
                        }
                        if (FirstDish.toLowerCase().indexOf("gazpacho") !== -1) {
                            temp_cost += 5;
                        }
                        if (FirstDish.toLowerCase().indexOf("soupe") !== -1) {
                            temp_cost += 4.5;
                        }

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

                                if (SecondDish.toLowerCase().indexOf("ravioli") !== -1) {
                                    temp_cost += 9;
                                }
                                if (SecondDish.toLowerCase().indexOf("boeuf") !== -1) {
                                    temp_cost += 11;
                                }
                                if (SecondDish.toLowerCase().indexOf("quiche") !== -1) {
                                    temp_cost += 8;
                                }

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

                                        if (Dessert.toLowerCase().indexOf("crème") !== -1) {
                                            temp_cost += 5;
                                        }
                                        if (Dessert.toLowerCase().indexOf("fruits") !== -1) {
                                            temp_cost += 5;
                                        }
                                        if (Dessert.toLowerCase().indexOf("fondant") !== -1) {
                                            temp_cost += 6;
                                        }

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
                                result += "finalement " + Dessert + " pour dessert. "
                            } else {
                                result += " aucun dessert. ";
                            }

                            result += "Ceci fait un total de " + temp_cost + " euros. ";

                            await sayTTS(result, "fr").then().catch();
                            //await myWait(1).then().catch();

                            await actionTTS("C'est correct?", "fr")
                                .catch()
                                .then(async(data) => {

                                    //console.log(data);

                                    if (data.topic === "hermes/intent/AccorInnovationCenter:Yes") {

                                        await sayTTS("Parfait, votre commande arrivera dans 20 minutes. Bonne dégustation!", "fr");

                                        rs_cost += temp_cost;
                                        temp_cost = 0;
                                        store.set('rs_cost', rs_cost);

                                        //await webRequestDATA("https://maker.ifttt.com/trigger/PushRich/with/key/c6h_lSARLyhKpzYEyNPt7STZGaW4knm53pc3Ur_BKR-", {
                                        //    "value1": "Commande de room service réalisée. Le montant de " + rs_cost + "€ sera débité de vote chambre."
                                        //}).then().catch();
                                        sendNotifMQTT("Commande de room service réalisée. Le montant de " + rs_cost + "€ sera débité de vote chambre.", true, true);

                                        await myWait(15).then().catch();


                                        //await webRequestDATA("https://maker.ifttt.com/trigger/PushRich/with/key/c6h_lSARLyhKpzYEyNPt7STZGaW4knm53pc3Ur_BKR-", {
                                        //    "value1": "Votre commande arrive dans une minute!"
                                        //}).then().catch();
                                        sendNotifMQTT("Votre commande arrive dans une minute!", true, true)

                                        process.exit();


                                    } else if (data.topic === "hermes/intent/AccorInnovationCenter:None") {

                                        await sayTTS("Ok, on annule. N'hésitez pas à refaire une demande.", "fr");
                                        process.exit()


                                    }

                                });

                        });

                });
        }
    })

    //Detect Reset
    listenIntent('AccorInnovationCenter:Reset').then(async(data) => {
        if (data.topic === "hermes/intent/AccorInnovationCenter:Reset") {

            await sayTTS("Je met le profil à zéro.", "fr").then().catch();

            rs_cost = 0;
            store.set('rs_cost', 0);
            rs_cost = 0;
            sendNotifMQTT("Profil reseted!", true, false);
            setTimeout(() => {
                process.exit();
            }, 1000);

        }
    });

    //Detect Checkout
    listenIntent('AccorInnovationCenter:Checkout').then(async(data) => {
        if (data.topic === "hermes/intent/AccorInnovationCenter:Checkout") {
            var total = rs_cost + 350;
            var checksum = "Très bien, faisons le tchèque à oute.   ";
            checksum += "Votre nuit d'hôtel fera 350 euros.   ";
            checksum += "Vous avez dépensé " + rs_cost + " euros en boissons et nourriture.  ";
            checksum += "Ceci vous fait un total de " + total + " euros.  ";

            await sayTTS(checksum, "fr").then().catch();

            await actionTTS("C'est correct?", "fr")
                .catch()
                .then(async(data) => {

                    //console.log(data);

                    if (data.topic === "hermes/intent/AccorInnovationCenter:Yes") {

                        await sayTTS("Parfait, on vous envoie la facture par courrier tout de suite.     Vous pouvez laisser votre clé de la chambre dans la boite située à l'entrée, ou sur la table de votre chambre. À très bientôt!", "fr");

                        await webRequestDATA("https://maker.ifttt.com/trigger/EmailInvoice/with/key/c6h_lSARLyhKpzYEyNPt7STZGaW4knm53pc3Ur_BKR-", {
                            "value1": total.toString(),
                            "value2": rs_cost.toString()

                        }).then((data) => {
                            console.log(data);
                        }).catch();

                        process.exit();


                    } else if (data.topic === "hermes/intent/AccorInnovationCenter:None") {

                        await sayTTS("Désolé pour le désagrément, il a dû y avoir une erreur. S'il vous plait, présentez-vous à l'accueil pour faire le tchèque à oute.", "fr");
                        process.exit()


                    }

                });



        }
    });

})