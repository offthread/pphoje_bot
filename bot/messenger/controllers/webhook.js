export function authenticate (req, res) {
  if (req.query['hub.node'] === 'subscribe' && req.query['hub.verify_token'] === 'ppbot-messenger_ot') {
      res.status(200).send(req.query['hub.challenge'])
    } else {
      res.sendStatus(403)
    }
}

export function receiveMessage (req, res) {
  const data = req.body

  if (data.object === 'page') {
    data.entry.forEach(entry => {
      const pageId = entry.pageId
      const timeOfEvent = entry.time

      entry.messaging.forEach(event => {
        if (event.message) {
          receivedMessage(event)
        } else {
          console.log('Unknown event', event)
        }
      })
    })

    res.sendStatus(200)
  }
}

function receivedMessage(event) {
  console.log("Message data:", event.message)
}