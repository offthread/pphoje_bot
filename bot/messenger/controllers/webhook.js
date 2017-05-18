import rp from 'request-promise'
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
  try {
    processMessage({senderID, message: event.message.text})
  } catch (error) {
    sendTextMessage({ recipientId: senderID, text: "Erro ao processar mensagem!" })
  }
}

function processMessage ({ senderID, message }) {
  if (_.upperCase(message) === config.help_command) {
    sendTextMessage({ recipientId: senderID, text: config.help_text })
  } else {
    const dates = botHelper.getDateFromMessage(message)
    apiService.getShows()
      .then(shows => {
        const filteredShows = botHelper.filterShows({ shows, dates })
        if (!_.isEmpty(filteredShows)) { 
          sendReply({ recipientId: senderID, shows: filteredShows })
        } else {
          sendTextMessage({ recipientId: senderID, text: "Nenhum show encontrado para o período desejado" })
        }
      })
      .catch(err => {
        console.log(err)
        sendTextMessage({ recipientId: senderID, text: "Erro ao processar mensagem!" })
      })
  }
}

function sendTextMessage({recipientId, text}) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text
    }
  }

  callSendAPI(messageData)
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
  rp({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: config.page_access_token },
    method: 'POST',
    json: messageData
  })
  .then((response, body) => {
    if (response.statusCode == 200) {
      var recipientId = body.recipient_id
      var messageId = body.message_id

      console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId)
    }
  })
  .catch(err => {
    console.error("Unable to send message.")
    console.error(err)
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