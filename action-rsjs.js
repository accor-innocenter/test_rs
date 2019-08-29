#! /usr/bin/env node


const { withHermes } = require('hermes-javascript');

const server = "http://192.168.86.76/";
/*
    A small js context manager that sets up an infinite loop to prevent
    the process from exiting, and exposes an instance of the Hermes class.
*/
withHermes(hermes => {
    // Instantiate a dialog object
    const dialog = hermes.dialog()

    // Subscribes to intent 'myIntent'
    dialog.flow('AccorInnovationCenter:OrderRS', (msg, flow) => {
        // Log intent message
        console.log(JSON.stringify(msg))
    
        flow.continue('AccorInnovationCenter:FirstCourse',(msg,flow) =>  {
            console.log(JSON.stringify(msg))

            flow.continue('AccorInnovationCenter:SecondCourse',(msg,flow) =>  {
                console.log(JSON.stringify(msg))
    
                flow.continue('AccorInnovationCenter:Dessert',(msg,flow) =>  {
                    console.log(JSON.stringify(msg))
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


                    return msg.slots[0].value.value+" est une spécialité de la maison. Très bien, votre commande arrivera dans 20 minutes."
        
                    
                });
                
                return msg.slots[0].value.value+", parfait. Et quel dessert souhaitez-vous déguster?"
    
            });

            return msg.slots[0].value.value+", excellent choix. Quel sera votre plat principal?"

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
        return 'Voici le menu sur votre écran. Quelle entrée voulez-vous?';
    })
})