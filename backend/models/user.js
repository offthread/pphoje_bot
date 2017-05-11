import mongoose from 'mongoose'
const Schema = mongoose.Schema

const UserSchema = new Schema({
  username: String,
  password: String
})

const model = mongoose.model('User', UserSchema)

export default model