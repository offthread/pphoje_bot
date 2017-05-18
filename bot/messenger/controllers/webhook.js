import _ from 'lodash'
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
  const senderID = event.sender.id
  processMessage({senderID, message: event.message.text})
}

function processMessage ({ senderID, message }) {
  const dates = botHelper.getDateFromMessage(message)
  apiService.getShows()
    .then(shows => {
      const filteredShows = botHelper.filterShows({ shows, dates })
      if (!_.isEmpty(filteredShows)) { 
        sendReply({ recipientId: senderID, shows: filteredShows })
      } else {
        sendDefaultMessage(senderID)
      }
    })
    .catch(err => console.log(err))
}

function sendDefaultMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Nenhum show encontrado para o período desejado"
    }
  }

  callSendAPI(messageData);
}

function sendReply ({ recipientId, shows }) {
  const data = createMessage(shows)
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: data
        }
      }
    }
  }

  callSendAPI(messageData)
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

function createMessage (shows) {
  let result = []
  _.forEach(shows, s => {
    result.push({
      title: s.name,
      subtitle: Moment(s.date).format('DD de MMMM'),
      image_url: s.imgUrl,
      buttons: [
        {
          type: "web_url",
          url: s.videoUrl,
          title: "Ver vídeo"
        }
      ]
    })
  })
  return result
}