import mongoose from 'mongoose'
const Schema = mongoose.Schema

const ShowSchema = new Schema({
  name: String,
  link: String,
  date: Date
})

const model = mongoose.model('Show', ShowSchema)

export default model