import express from 'express'
import morgan from 'morgan'
import * as showsController from '../modules/shows'

const router = express.Router()

router.use(morgan('dev'))

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
