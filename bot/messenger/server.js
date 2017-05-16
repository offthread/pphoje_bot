import express from 'express'
import bodyParser from 'body-parser'
import _ from 'lodash'

import router from './routes'

const app = express()

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const port = process.env.PORT || 3001

app.use('/', router)
app.listen(port)

console.log(`Listening on port ${port}`)
