const path = require('path')
const del = require('del')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin')
const pathToRegexp = require('path-to-regexp')

const {
  getRevisionInfo
} = require('./common')
const getBaseConfig = require('./getBaseConfig')
const getEntryFile = require('./getEntryFile')

module.exports = async function({
  projectConfig: {
    title,
    projectPath,
    routePath,
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
  sourceMap,
  distPath,
  suffix,
  subApp,
}) {

  const sourcePath = path.resolve(projectPath, '../../..')
  if (localSuffix) {
    suffix = localSuffix
  }
  if (!outPath) {
    outPath = routePath
  }
  if (spa) {
    distPath = outPath
  }
  const publicPath = spa ? './' : '/' + pathToRegexp.compile(outPath)({
    suffix: subApp || suffix,
    subApp: subApp || suffix,
  }) + '/'
  const projectDistPath = path.join(distPath, publicPath)

  await del(
    ['index.html', 'static', 'cdn'].map(filename =>
      path.join(projectDistPath, filename)
    ), {
      force: true,
    }
  )

  const minimizer = [
    // new OptimizeCSSPlugin({
    // cssProcessorOptions: {
    // safe: true,
    // },
    // }),
  ]
  const copyList = [{
    from: path.join(projectPath, 'static'),
    to: path.join(projectDistPath, 'static'),
    ignore: ['.*'],
  }]

  if (spa) {
    copyList.push({
      from: path.join(sourcePath, '../public/cdn'),
      to: path.join(projectDistPath, 'cdn'),
    })
  } else {
    minimizer.push(new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          pure_funcs: ['console.log', 'console.info'],
        },
      },
      parallel: true,
    }))
  }

  const banner = JSON.stringify(await getRevisionInfo(sourcePath), null, 2)
  return merge(await getBaseConfig({
    sourcePath,
    sourceMap,
    projectPath,
    projectInfo: {
      ...projectConfig.customInfo,
      type,
      admin,
      design,
    },
    suffix,
  }), {
    mode: 'production',
    entry: path.join(projectPath, getEntryFile(projectConfig)),
    output: {
      publicPath,
      path: projectDistPath,
      filename: 'static/js/[name].[chunkhash].js',
      chunkFilename: 'static/js/[id].[chunkhash].js',
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[hash].css',
        chunkFilename: 'static/css/[id].[hash].css',
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.join(projectPath, spa ? 'cordova.html' : 'index.html'),
        inject: true,
        templateParameters: {
          dev: false,
          publicPath,
          title: '',
          dbiHost,
        },
        minify: spa ? false : {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: false,
        },
      }),
      new CopyWebpackPlugin(copyList),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        baseUrl: JSON.stringify('/'),
        routerMode: JSON.stringify('hash'),
        staticUrl: JSON.stringify(publicPath + '/static/'),
      }),
      new webpack.BannerPlugin((banner)),
    ],
    performance: {
      hints: false,
    },
    optimization: {
      minimizer,
    },
  })
}
