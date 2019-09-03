var child_process = require('child_process');
const { withHermes } = require('hermes-javascript');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const myChild = __dirname + "/child.js";

function start() {
    if (typeof nodefile !== 'string') {
        console.log('Has none file. like this: start("app.js")');
    }

    console.log('Master process is running.');

    var proc = child_process.spawn('node', [myChild]);

    proc.stdout.on('data', function(data) {
        console.log(data.toString());
    });

    proc.stderr.on('data', function(data) {
        console.log(data.toString());
    });

    proc.on('exit', function(code) {
        console.log('child process exited with code ' + code);
        delete(proc);
        setTimeout(() => {
            console.log("child relaunched");
            start();
        }, 1000);
    });
}


start();

var sayClient = client;

sayClient.publish('hermes/tts/say', JSON.stringify({
    "text": "Je suis en train de démarrer...",
    "lang": "fr",
    "siteId": "default"
}));