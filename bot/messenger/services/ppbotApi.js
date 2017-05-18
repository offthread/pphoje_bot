import rp from 'request-promise'
import config from '../config'

function getShows () {
  return new Promise((resolve, reject) => {
    rp(`${config.api_url}/shows`)
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

export default { getShows }
