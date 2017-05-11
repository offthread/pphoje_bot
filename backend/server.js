import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import _ from 'lodash'

import { default as Show } from './models/show'

const app = express()
mongoose.Promise = global.Promise
mongoose.connect('mongodb://api:offthread@ds137141.mlab.com:37141/ppbot-db')

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const port = process.env.PORT || 3000

const router = express.Router()

// middleware to use for all requests
router.use((req, res, next) => {
    // do logging
    console.log(`${req.method} ${req.originalUrl} called`)
    next() // make sure we go to the next routes and don't stop here
})

router.get('/', (req, res) => {
    res.json({ message: 'hooray! welcome to our api!' })
})

router.route('/shows')
  .post((req, res) => {
    const show = new Show()
    show.name = req.body.name
    show.link = req.body.link
    show.date = req.body.date

    show.save().then(s => {
      res.json({ message: `${s.name} inserted` })
    }).catch(err => {
      res.send(err)
    })
  })
  .get((req, res) => {
    Show.find((err, shows) => {
      if (err) res.send(err)
      res.json(shows)
    })
  })

router.route('/shows/:show_id')
  .get((req, res) => {
    Show.findById(req.params.show_id, (err, show) => {
      if (err) res.send(err)
      res.json(show)
    })
  })
  .put((req, res) => {
    let attributes = {}
    const { name, link, date } = req.body

    if (!_.isEmpty(name)) {
      attributes.name = name
    }

    if (!_.isEmpty(link)) {
      attributes.link = link
    }

    if (!_.isEmpty(date)) {
      attributes.date = date
    }

    Show.findByIdAndUpdate(req.params.show_id, { $set: attributes }, { new: true }, (err, s) => {
      if (err) res.send(err)
      res.json({ messsage: `${s.name} updated!` })
    })
  })
  .delete((req, res) => {
    Show.remove({
      _id: req.params.show_id
    }, (err, show) => {
      if (err) res.send(err)
      res.json({ message: 'Show removed!' })
    })
  })

app.use('/api', router)
app.listen(port)

console.log(`Magic happens on port ${port}`)
