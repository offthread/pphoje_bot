import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import _ from 'lodash'

import router from './routes'
import config from './config'

const app = express()
mongoose.Promise = global.Promise
mongoose.connect(config.database.url)

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const port = process.env.PORT || 3000

app.use('/api', router)
app.listen(port)

console.log(`Magic happens on port ${port}`)
