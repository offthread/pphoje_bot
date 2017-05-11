import express from 'express'
import morgan from 'morgan'
import * as showsController from '../controllers/shows'
import * as usersController from '../controllers/users'
import * as authenticationController from '../controllers/authentication'

const router = express.Router()

router.use(morgan('dev'))

router.get('/', (req, res) => {
  res.json({ message: 'hooray! welcome to our api!' })
})

router.post('/user', usersController.createUser)

router.post('/authenticate', authenticationController.authenticate)

router.route('/shows')
  .get(showsController.getAllShows)

router.use(authenticationController.verifyToken)

router.route('/shows')
  .post(showsController.insertShow)

router.route('/shows/:show_id')
  .get(showsController.getShow)
  .put(showsController.updateShow)
  .delete(showsController.removeShow)

export default router
