const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
const getBaseConfig = require('./getBaseConfig')
const getEntryFile = require('./getEntryFile')

module.exports = async function ({
  projectConfig: {
    title,
    projectPath,
    outPath,
    ssr,
    type,
    admin,
    design,
    spa,
    suffix: localSuffix,
    dbiHost,
  },
  projectConfig,
  routePath,
  // appPath,
  suffix,
  baseUrl,
}) {
  ssr = false
  const sourcePath = path.resolve(projectPath, '../../..')
  if (localSuffix) {
    suffix = localSuffix
  }

  const entryFile = getEntryFile(projectConfig)
  
  const baseConfig = await getBaseConfig({
    sourcePath,
    sourceMap: 'source-map',
    projectPath,
    projectInfo: {
      ...projectConfig.customInfo,
      type,
      admin,
      design,
    },
    suffix,
  })

  const publicPath = baseUrl + routePath + '/'
  const clientConfig = merge(baseConfig, {
    mode: 'development',
    entry: [
      `${ require.resolve('webpack-hot-middleware/client') }?path=${routePath}/__webpack_hmr&timeout=20000&quiet=true`,
      path.join(projectPath, entryFile),
    ],
    output: {
      publicPath,
    },
    plugins: [
      new VueSSRClientPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development'),
        baseUrl: JSON.stringify(ssr ? routePath : '/'),
        routerMode: JSON.stringify(ssr ? 'history' : 'hash'),
        staticUrl: JSON.stringify(routePath + '/static/'),
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.join(projectPath, spa ? 'cordova.html' : 'index.html'),
        inject: true,
        templateParameters: {
          publicPath,
          title,
          dbiHost,
          dev: true,
        },
      })
    ],
  })

  return {
    clientConfig,
  }
}
