import rp from 'request-promise'
import _ from 'lodash'
import Moment from 'moment'

import config from '../config'
import constants from '../constants'
import botHelper from '../helpers'
import apiService from '../services/ppbotApi'

const PAGE_TOKEN = process.env.MESSENGER_PAGE_TOKEN

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
    sendTextMessage({ recipientId: senderID, text: "Erro ao processar mensagem! :( Tente novamente em alguns instantes." })
  }
}

function processMessage ({ senderID, message }) {
  sendTyping(senderID)

  if (_.upperCase(message) === config.help_command) {
    sendTextMessage({ recipientId: senderID, text: config.help_text }).then(r => {
      console.log('sucessooooooo')
      console.log(r)
      sendDefaultMessages(senderID)}
      )
    .catch(err => {
      console.log(err)
    })
  } else if(_.includes(constants.GREETINGS, _.chain(message.replace(constants.MARKS_REGULAR_EXPRESSION, '')).upperCase().replace('Á', 'A').value())) {
    sendTextMessage({ recipientId: senderID, text: "Oi! Envie 'Ajuda' para detalhes de como ficar por dentro da programação do Maior e Melhor São João do Mundo :D" })
  } else if (_.includes(constants.THANKS, _.chain(message.replace(constants.MARKS_REGULAR_EXPRESSION, '')).upperCase().value())) {
    sendTextMessage({ recipientId: senderID, text: "Por nada! ;)" })
  } else {
    let dates = []

    try {
      dates = botHelper.getDateFromMessage(message)
    } catch (error) {
      console.log(error)
      if (error.name === 'InvalidStringException') {
        sendTextMessage({ recipientId: senderID, text: "Ops! Mensagem inválida. Envie 'Ajuda' para mais detalhes de como utilizar o Bot! :)" })
      } else {
        sendTextMessage({ recipientId: senderID, text: "Ops! Data inválida. O Maior e Melhor São João do Mundo vai de 02 de junho a 02 de julho de 2017! :)" })
      }
      return
    }

    apiService.getShows()
    .then(shows => {
      const filteredShows = botHelper.filterShows({ shows, dates })
      if (!_.isEmpty(filteredShows)) { 
        sendReply({ recipientId: senderID, shows: filteredShows })
      } else {
        sendTextMessage({ recipientId: senderID, text: "Nenhum show encontrado para o dia desejado" })
      }
    })
    .catch(err => {
      console.log(err)
      sendTextMessage({ recipientId: senderID, text: "Erro ao processar mensagem! :( Tente novamente em alguns instantes." })
    }) 
  }
}

function sendTextMessage ({recipientId, text}) {
  return new Promise((resolve, reject) => {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text
      }
    }

    callSendAPI(messageData).then(r => resolve(true)).catch(err => reject(err))
  })
}

function sendDefaultMessages (senderId) {
  rp({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_TOKEN },
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      message: {
        text: 'Consultas rápidas:',
        quick_replies: [
          {
            content_type: 'text',
            title: 'Hoje',
            payload: 'hoje'
          },
          {
            content_type: 'text',
            title: 'Amanhã',
            payload: 'amanha'
          }
        ]
      }
    }
  })
  .then((response, body) => {
    if (response.statusCode == 200) {
      var recipientId = body.recipient_id
      var messageId = body.message_id

      console.log("Successfully sent typing message with id %s to recipient %s", messageId, recipientId)
    }
  })
  .catch(err => {
    console.error("Unable to send message.")
    console.error(err)
  })
}

function sendReply ({ recipientId, shows }) {
  _.forIn(shows, (value, key) => {
    const data = createMessage(value)
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
  })
}

function sendTyping (senderId) {
  rp({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_TOKEN },
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      sender_action: 'typing_on'
    }
  })
  .then((response, body) => {
    if (response.statusCode == 200) {
      var recipientId = body.recipient_id
      var messageId = body.message_id

      console.log("Successfully sent typing message with id %s to recipient %s", messageId, recipientId)
    }
  })
  .catch(err => {
    console.error("Unable to send message.")
    console.error(err)
  })
}

function callSendAPI(messageData) {
  return new Promise((resolve, reject) => {
    rp({
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: PAGE_TOKEN },
      method: 'POST',
      json: messageData
    })
    .then((response, body) => {
      if (response.statusCode == 200) {
        var recipientId = body.recipient_id
        var messageId = body.message_id

        console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId)
        resolve(true)
      }
    })
    .catch(err => {
      console.error("Unable to send message.")
      console.error(err)
      reject(err)
    })
  })
}

function createMessage (shows) {
  let result = []
  _.forEach(shows, s => {
    result.push({
      title: s.name,
      subtitle: Moment(s.date).format('DD [de] MMMM - dddd'),
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