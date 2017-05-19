const env = process.env.NODE_ENV || 'production'
const envConfig = require(`./${env}/index`).default

export default envConfig