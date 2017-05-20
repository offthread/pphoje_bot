import express from 'express'
import morgan from 'morgan'
import * as showsController from '../controllers/shows'
import * as usersController from '../controllers/users'
import * as authenticationController from '../controllers/authentication'
import * as heartbeatController from '../controllers/heartbeat'

const router = express.Router()

router.use(morgan('dev'))

router.get('/heartbeat', heartbeatController.heartbeat)

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
