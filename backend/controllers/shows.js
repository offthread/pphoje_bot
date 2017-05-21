import Show from '../models/show'
import _ from 'lodash';

export function getAllShows (req, res) {
  Show.find((err, shows) => {
    if (err) res.send(err)
    res.json(shows)
  })
}

export function getShow (req, res) {
  Show.findById(req.params.show_id, (err, show) => {
    if (err) res.send(err)
    res.json(show)
  })
}

export function insertShow (req, res)  {
  const show = new Show()
  show.name = req.body.name
  show.videoUrl = req.body.videoUrl
  show.imgUrl = req.body.imgUrl
  show.date = req.body.date

  show.save().then(s => {
    res.json({ success: true, message: `${s.name} inserted`, show: s })
  }).catch(err => {
    res.send({ success: false, message: err })
  })
}

export function updateShow (req, res) {
  let attributes = {}
  const { name, videoUrl, imgUrl, date } = req.body

  if (!_.isEmpty(name)) {
    attributes.name = name
  }

  if (!_.isEmpty(videoUrl)) {
    attributes.videoUrl = videoUrl
  }

  if (!_.isEmpty(imgUrl)) {
    attributes.imgUrl = imgUrl
  }

  if (!_.isEmpty(date)) {
    attributes.date = date
  }

  Show.findByIdAndUpdate(req.params.show_id, { $set: attributes }, { new: true }, (err, s) => {
    if (err) res.send(err)
    res.json({ success: true, messsage: `${s.name} updated!`, show: s })
  })
}

export function removeShow (req, res) {
  Show.findOneAndRemove({
    _id: req.params.show_id
  }, (err, show) => {
    if (err) res.send(err)
    res.json({ success: true, message: 'Show removed!', show: show })
  })
}
