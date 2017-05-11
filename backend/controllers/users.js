import User from '../models/user'
import bcrypt from 'bcrypt'

export function createUser (req, res) {
  const user = new User()

  const { username, password } = req.body

  user.username = username

  bcrypt.hash(password, 10, (err, hash) => {
    user.password = hash
    user.save((err, u) => {
      if (err) res.send(err)
      res.json({ message: `${u.username} created!` })
    })
  })
}