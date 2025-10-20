import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
const app = express()

// init middlewares
app.use(morgan("dev"))  // format the output of logging

    // app.use(morgan("combined"))
    // app.use(morgan("short"))
    // app.use(morgan("common"))

app.use(helmet())   // hide the X-Power-By => if hacker know that field =>abuse the vulnerabilities of that field to exploit 

app.use(compression())  //compress data size during transmission=>  makes your app faster and reduces bandwidth usage example: raw 141KB is converted into 1.4KB 

// init database

// init routers
app.get('/', (req, res, next)=> {
    return res.status(500).json({
        message: 'Welcome my system'
    })

})

// handling error
export default app;