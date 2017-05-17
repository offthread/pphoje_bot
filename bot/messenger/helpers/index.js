import Moment from 'moment'
import constants from '../constants'

Moment().locale('pt-BR')

function getDateFromMessage (message) {
  let result = []

  if (message.match(constants.DATE_REGULAR_EXPRESSION) && isValidDate(message)) {
    result.push(Moment(message, 'DD/MM/YYYY'))
  } else if (message.match(constants.NUMBER_REGULAR_EXPRESSION) && message !== '31') {
    result = getDatesFromNumber(message)
  } else {
    result.push(getDayFromString(message))
  }

  return result
}

function isValidDate (date) {
  try {
    const parsedDate = Moment(date, 'DD/MM/YYYY') 
  } catch (error) {
    console.log(error)
    return false
  }
  return parsedDate.isBetween(config.sj_initial_day, config.sj_end_day)
}

function getDatesFromNumber (day) {
  let result = []

  try {
    const juneDate = `${day}/06/2017`
    const julyDate = `${day}/07/2017`
    if (isValidDate(juneDate)) {
      result.push(juneDate)
    } 
    if (isValidDate(julyDate)) {
      result.push(julyDate)
    } 
  } catch (error) {
    console.log(error)
  }

  return result
}

function getDayFromString (day) {
  let result = {}
  try {
    result = Moment().day(day)
  } catch (error) {
    console.log(error)
  }
  return result
}

export default {
  getDateFromMessage
}
