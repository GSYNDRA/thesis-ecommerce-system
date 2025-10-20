//  only declare the port number and initialize the system server.
import app from "./src/app.js"
const PORT = 3030

const server = app.listen(PORT, ()=> {
    console.log(`thesis-ecommerce-system start with ${PORT}`)
})

process.on('SIGINT', ()=> {
    // notify when server close.
    server.close( ()=> console.log(`Exit server Express`))
    // notify.send(ping)
})