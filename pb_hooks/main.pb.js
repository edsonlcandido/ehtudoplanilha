onBootstrap((e) => {
    e.next()
    const config = require(`${__hooks}/config.json`)
    console.log(config.google_client_id)    
})