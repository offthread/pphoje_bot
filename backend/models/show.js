import mongoose from 'mongoose'
const Schema = mongoose.Schema

const ShowSchema = new Schema({
  name: String,
  videoUrl: String,
  imgUrl: String,
  date: Date
})

const model = mongoose.model('Show', ShowSchema)

export default model