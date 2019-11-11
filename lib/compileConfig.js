const path = require('path')
const fs = require('then-fs')
const pug = require('pug')
const mkdirp = require('mkdirp')

module.exports = async function ({
  originalSourcePath,
	filePath,
	inSystem = false,
}) {
	await mkdirp(path.dirname(filePath))
  await fs.writeFile(filePath, pug.compileFile(path.join(originalSourcePath, 'src/common/config_js.pug'))({
		dev: false,
		inSystem,
  }))
}
