import _ from 'lodash'
import Moment from 'moment'

import config from '../config'
import constants from '../constants'

Moment.locale('pt-BR')

function getDateFromMessage (message) {
  let result = []

  if (message.match(constants.DATE_REGULAR_EXPRESSION)) {
    if(isValidDate(message)) {
      result.push(Moment(message, 'DD/MM'))
    } else {
      throw new Error('Invalid date')
    }
  } else if (message.match(constants.NUMBER_REGULAR_EXPRESSION) && message !== '31') {
    result = getDatesFromNumber(message)
  } else {
    result.push(getDayFromString(message))
  }

  return result
}

function filterShows ({ shows, dates }) {
  let result = []
  _.forEach(shows, s => {
    const showDate = Moment(s.date, 'YYYY-MM-DD')
    _.forEach(dates, d => {
      if (showDate.isSame(d, 'day')) {
        result.push(s)
      }
    })
  })

  result = _.groupBy(result, 'date')
  return result
}

function isValidDate (date) {
  const  parsedDate = Moment(date, 'DD/MM/YYYY')
  return parsedDate.isValid() || parsedDate.isBetween(config.sj_initial_day, config.sj_end_day)
}

function getDatesFromNumber (day) {
  let result = []

  try {
    day = Number(day)
    const juneDate = `${day}/06/2017`
    const julyDate = `${day}/07/2017`
    if (isValidDate(juneDate)) {
      result.push(Moment(juneDate, 'DD/MM/YYYY'))
    } 
    if (isValidDate(julyDate)) {
      result.push(Moment(julyDate, 'DD/MM/YYYY'))
    } 
  } catch (error) {
    console.log(error)
  }

  return result
}

function getDayFromString (day) {
  let result = {}

  if (_.upperCase(day) === constants.TODAY_TEXT) {
    result = Moment()
  } else if (_.chain(day).upperCase().replace('Ã', 'A').value() === constants.TOMORROW_TEXT) {
    result = Moment().add(1, 'days')
  } else if (checkDayName(day)) {
    day = validateSaturday(day)
    result = getDayFromName(day)
  } else {
    throw { name: 'InvalidStringException', message: 'Invalid input' }
  }

  return result
}

function validateSaturday (day) {
  return _.chain(day).lowerCase().startsWith('sab').value() ? _.chain(day).lowerCase().replace('sab', 'sáb').value() : day
}

function checkDayName (day) {
  return _.some(Moment.localeData().weekdaysShort(), d => (_.lowerCase(d) === _.lowerCase(day))) || _.some(Moment.localeData().weekdays(), d => (_.lowerCase(d) === _.lowerCase(day)))
}

function getDayFromName (day) {
  return Moment().day(day, 'ddd').isBefore(Moment(), 'day') ? Moment().add(1, 'weeks').day(day, 'ddd') : Moment().day(day, 'ddd')
}

export default {
  filterShows,
  getDateFromMessage
}
