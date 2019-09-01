var child_process = require('child_process');

const myChild = "child.js";

start();
function start() {
    if (typeof nodefile !== 'string') {
        console.log('Has none file. like this: start("app.js")');
    }

    console.log('Master process is running.');
    
    var proc = child_process.spawn('node', [myChild]);

    proc.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    proc.stderr.on('data', function (data) {
        console.log(data.toString());
    });

    proc.on('exit', function (code) {
        console.log('child process exited with code ' + code);
        delete(proc);
        setTimeout(()=>{
            console.log("child relaunched");
            start();
        }, 1000);
    });
}