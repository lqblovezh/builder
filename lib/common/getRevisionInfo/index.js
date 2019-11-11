const path = require('path')
const mkdirp = require('mkdirp')
const moment = require('moment')
const fs = require('then-fs')

const getLocalInfo = require('./getLocalInfo')
const getGitInfo = require('./getGitInfo')

module.exports = async function (workspace = process.cwd()) {
  const info = await getLocalInfo(workspace)
  try {
    info.git = await getGitInfo(workspace)
  } catch (e) { }
  return info
}

