const env = process.env.NODE_ENV || 'development'
const envConfig = require(`./${env}/index`).default

export default envConfig