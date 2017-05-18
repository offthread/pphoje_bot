import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import _ from 'lodash'

import router from './routes'
import config from './config'

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

const app = express()
mongoose.Promise = global.Promise
mongoose.connect(config.database.url)

// configure app to use bodyParser()
// this will let us get the data from a POST

// allow CORS
app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const port = process.env.PORT || 3000

app.use('/api', router)
app.listen(port)

console.log(`Listening on port ${port}`)
