const path = require('path')
const optimist = require('optimist')
const shelljs = require('shelljs')
const camelcaseKeys = require('camelcase-keys')

async function main({
  _: [originalSourcePath],
  build,
  runServer,
  distPath,
  ...opts
}) {
  if (!originalSourcePath) {
    originalSourcePath = process.cwd()
  } else {
    originalSourcePath = path.resolve(originalSourcePath)
  }
  if (distPath) {
    distPath = path.resolve(distPath)
  }

  process.chdir(originalSourcePath)

  if (build) {
    process.env.NODE_ENV = 'production'
    return require('./build')({
      ...opts,
      distPath,
      originalSourcePath,
    })
  } else if (runServer) {
    process.env.NODE_ENV = 'development'
    return require('./runServer')({
      ...opts,
      originalSourcePath,
    })
  } else {
    optimist.showHelp()
  }
}

const { argv } = optimist
  .usage(['build-helper --xbook --build  [.]'].join('\n'))
  .describe('build', '对项目进行打包')
  .describe('run-server', '运行开发服务')
  .describe('one-by-one', '打包多个项目时，自动分批执行（针对性能比较差的电脑）')
  .describe('suffix', '需要优先编译的文件后缀名称').default('suffix', 'base')
  .describe('sub-app', '子应用的编译文件的输出目录，缺省时使用 suffix 作为应用目录')
  .describe('dist-path', '指定编译文件的输出根目录（缺省输出到 ../public）')
  .describe('site-name', '服务代理站点名称（配置文件在 src/common/siteConfigs.js）').default('site-name', 'dev')
  .describe('port', '指定首选端口').default('port', 7100)
  .boolean(['build', 'run-server', 'one-by-one'])
  .string(['suffix', 'sub-app', 'dist-path'])
main(camelcaseKeys(argv)).catch(console.error)
