module.exports = function ({
  design,
  ssr,
}) {
  let entryFile
  if (design == 'app') {
    entryFile = 'entry-spa.js'
  } else if (ssr) {
    entryFile = 'entry-client.js'
  } else {
    entryFile = 'main.js'
  }
  return entryFile
}
