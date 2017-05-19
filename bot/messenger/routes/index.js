import express from 'express'
import morgan from 'morgan'

import * as webhookController from '../controllers/webhook'

const router = express.Router()

router.use(morgan('dev'))

router.get('/webhook', webhookController.authenticate)
router.post('/webhook', webhookController.receiveMessage)

export default router
