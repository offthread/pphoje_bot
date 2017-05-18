import config from '../config'
import botHelper from '../helpers'
import apiService from '../services/ppbotApi'

export function authenticate (req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'ppbot-messenger_ot') {
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
  processMessage(event.message)
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: config.page_access_token },
    method: 'POST',
    json: messageData

  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId)
    } else {
      console.error("Unable to send message.")
      console.error(response)
      console.error(error)
    }
  })
}

function processMessage (message) {
  const dates = botHelper.getDateFromMessage(message)
  let shows = []
  apiService.getShows()
    .then(res => shows = res)
    .catch(err => console.log(err))
  console.log(shows)
}