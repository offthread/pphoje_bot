import express from 'express'
import _ from 'lodash'

import router from './routes'

const app = express()

const port = process.env.PORT || 3001

app.use('/', router)
app.listen(port)

console.log(`Listening on port ${port}`)
