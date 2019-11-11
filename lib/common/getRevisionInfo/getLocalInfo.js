const os = require('os')
const moment = require('moment')

module.exports = async function (workspace) {
  const {username} = os.userInfo()
  const hostname = os.hostname()
  const platform  = os.platform()
  return {
    buildtime: moment().format('YYYY-MM-DD HH:mm:ss'),
    workspace,
    username,
    hostname,
    platform,
  }
}
