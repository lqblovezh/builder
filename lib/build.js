const path = require('path')
const webpack = require('webpack')
const inquirer = require('inquirer')
const prettyHrtime = require('pretty-hrtime')
const clc = require('cli-color')
const pify = require('pify')

const getProdConfig = require('./getProdConfig')
const compileConfig = require('./compileConfig')

module.exports = async function ({
  originalSourcePath,
  sourceMap,
  configPath,
  distPath,
  suffix,
  subApp,
  oneByOne,
}) {
  if (!configPath) {
    configPath = path.join(originalSourcePath, 'src/projects/configs')
  }
  if (!distPath) {
    distPath = path.join(originalSourcePath, '../public')
  }
  
  const projectConfigs = require(configPath)

  const questions = projectConfigs.map(({title, projectPath}, i) => ({
    type: 'confirm',
    name: ''+i,
    message: `是否打包 [${path.basename(projectPath)}] [${title}]`,
    default: false,
  }))
  questions.push({
    type: 'confirm',
    name: 'conf',
    message: '是否编译 [config_js]',
    default: false,
  })
  const answers = await inquirer.prompt(questions)
  const configs = await Promise.all(projectConfigs.filter((v,i) => answers[i]).map(projectConfig => getProdConfig({
    // originalSourcePath,
    projectConfig,
    sourceMap,
    distPath,
    suffix,
    subApp,
  })))

  const start = process.hrtime()
  
  let errors = [], warnings = []
  if (oneByOne) {
    let promise = Promise.resolve()
    configs.forEach((config, i) => {
      promise = promise.then(() => pify(webpack)(config).then(stats => {
        const info = stats.toJson()
        errors = errors.concat(info.errors)
        warnings = warnings.concat(info.warnings)
      }))
    })
    await promise
  } else {
    const stats = await pify(webpack)(configs)
    const info = stats.toJson()
    errors = info.errors
    warnings = info.warnings
  }
  
  if (answers.conf) {
    await compileConfig({
      originalSourcePath,
      filePath: path.join(distPath, '_static', subApp || '.', 'config_js.blade.php'),
    })
    await compileConfig({
      originalSourcePath,
      filePath: path.join(distPath, '_system', 'system_config_js.blade.php'),
      inSystem: true,
    })
  }

  const messages = []
  if (errors.length) {
    console.log(clc.redBright(errors.join('\n\n')))
    messages.push(`错误 ${ clc.redBright(errors.length) }`)
  }
  if (warnings.length) {
    console.log(clc.yellow(warnings.join('\n\n')))
    messages.push(`警告 ${ clc.yellow(warnings.length) }`)
  }
  messages.push(`耗时 ${ prettyHrtime(process.hrtime(start)) }`)
  console.log(messages.join('；'))
}
