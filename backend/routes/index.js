import express from 'express'

import * as showsController from '../modules/shows'

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
  .post(showsController.insertShow)
  .get(showsController.getAllShows)

router.route('/shows/:show_id')
  .get(showsController.getShow)
  .put(showsController.updateShow)
  .delete(showsController.removeShow)

export default router
