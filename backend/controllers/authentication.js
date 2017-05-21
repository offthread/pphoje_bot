import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import User from '../models/user'
import config from '../config'

export function authenticate (req, res) {
  User.findOne({
    username: req.body.username
  }, (err, user) => {
    if (err) res.send(err)

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' })
    } else {
      bcrypt.compare(req.body.password, user.password, (err, match) => {
        if (!match) {
          res.json({ success: false, message: 'Authentication failed. Wrong password.' })
        } else {
          // if user is found and password is right
          // create a token
          const token = jwt.sign(user, config.secret, {
            expiresIn: 60 * 60 * 24 // In seconds, so: 60 seconds (1 minute) * 60 minutes (1 hour) * 24 (1 day)
          })
          res.json({
            success: true,
            message: 'Token generated',
            token: token
          })
        }
      })
    }
  })
}

export function verifyToken (req, res, next) {
  const token = req.headers['x-access-token']
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' })
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded
        next()
      }
    })
  } else {
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    })
  }
}