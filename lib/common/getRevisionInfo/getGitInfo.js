const path = require('path')
const simpleGit = require('simple-git/promise')

module.exports = async function (workspace) {
  const git = simpleGit(workspace)
  const {
    current,
    branches,
  } = await git.branchLocal()
  if (!current) {
    return null
  }
  const {
    name,
    commit,
  } = branches[current]
  const user = splitRaw(await git.raw('config --get user.name'.split(' ')))
  const email = splitRaw(await git.raw('config --get user.email'.split(' ')))
  const remote = splitRaw(await git.raw('remote -v'.split(' ')))
  const message = splitRaw(await git.raw('log -n 1'.split(' ')))
  return {
    branch: name,
    hash: commit,
    message,
    user,
    email,
    remote,
  }
}

function splitRaw (text) {
  if (!text) {
    return text
  }
  const list = text.replace(/\t/g, ' ').split(/\n/g).filter(s => !!s)
  if (list.length == 1) {
    return list[0]
  }
  return list
}
