#! /usr/bin/env node


const { withHermes } = require('hermes-javascript')

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
        // End the session
        flow.end()
        // Use text to speech
        return 'Voici le menu';
    })
})