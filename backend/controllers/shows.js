import Show from '../models/show'

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
  show.link = req.body.link
  show.date = req.body.date

  show.save().then(s => {
    res.json({ message: `${s.name} inserted`, show: s })
  }).catch(err => {
    res.send(err)
  })
}

export function updateShow (req, res) {
  let attributes = {}
  const { name, link, date } = req.body

  if (!_.isEmpty(name)) {
    attributes.name = name
  }

  if (!_.isEmpty(link)) {
    attributes.link = link
  }

  if (!_.isEmpty(date)) {
    attributes.date = date
  }

  Show.findByIdAndUpdate(req.params.show_id, { $set: attributes }, { new: true }, (err, s) => {
    if (err) res.send(err)
    res.json({ messsage: `${s.name} updated!`, show: s })
  })
}

export function removeShow (req, res) {
  Show.remove({
    _id: req.params.show_id
  }, (err, show) => {
    if (err) res.send(err)
    res.json({ message: 'Show removed!' })
  })
}
