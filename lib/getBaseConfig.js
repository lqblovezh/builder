const fs = require('then-fs')
const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { VueLoaderPlugin } = require('vue-loader')
const loadJsonFile = require('load-json-file')
const CheckRealPathPlugin = require('check-realpath-webpack-plugin')

const default_extensions = ['.js', '.vue', '.json']

module.exports = async function ({
  sourcePath,
  sourceMap,
  projectPath,
  projectInfo,
  suffix,
}) {
  const isProd = process.env.NODE_ENV == 'production'
  const __SUFFIX__ = JSON.stringify(suffix)
  const __PROJECT_INFO__ = JSON.stringify(projectInfo)

  let extensions = default_extensions
  if (suffix != 'base') {
    extensions = default_extensions.map(ext => '.' + suffix + ext).concat(extensions)
  }

  const babelOptions = await loadJsonFile(path.join(sourcePath, '.babelrc'))

  return {
    plugins: [
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        __SUFFIX__,
        __PROJECT_INFO__,
      }),
      new CheckRealPathPlugin(),
    ],
    output: {
      path: path.resolve('./dist'),
      filename: 'static/js/[name].js',
    },
    devtool: sourceMap ? 'source-map' : false,
    resolve: {
      modules: [
        path.join(sourcePath, 'node_modules'),
      ],
      extensions,
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        'joi': 'joi-browser',
        '@': projectPath,
        'common': path.join(projectPath, 'common'), // for styl
        'projects': path.join(sourcePath, 'src/projects'),
        'services': path.join(sourcePath, 'src/services'),
      },
    },
    module: {
      rules: [
        {
          test: /\.vue/,
          loader: require.resolve('vue-loader'),
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: sourcePath,
          options: {
            ...babelOptions,
            compact: false,
            babelrc: false,
          },
        },
        {
          test: /\.css$/,
          use: [
            isProd ? {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: '../../',
              }
            } : 'vue-style-loader',
            'css-loader',
            'postcss-loader',
          ]
        },
        {
          test: /\.(styl|stylus)$/,
          use: [
            isProd ? {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: '../../',
              }
            } : 'vue-style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                minimize: true,
              }
            },
            'stylus-loader',
          ]
        },
        {
          test: /\.pug$/,
          // loader: 'pug-loader',
          loader: 'pug-plain-loader',
        },
        {
          test: /\.jade$/,
          loader: 'pug-loader',
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          loader: 'url-loader',
          options: {
            limit: false,
            name: 'static/img/[name].[hash].[ext]',
          },
        },
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 100000,
            name: 'static/media/[name].[ext]?[hash]',
          },
        },
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 100000,
            name: 'static/font/[name].[ext]?[hash]',
          },
        },
        {
          test: /\.(html|mustache)$/i,
          loader: require.resolve('html-webpack-plugin/lib/loader'),
          include: [
            path.join(projectPath, 'index.html'),
            path.join(projectPath, 'cordova.html'),
            // path.join(projectPath, 'index.mustache'),
          ],
          options: {
            force: true,
          }
        },
      ],
    },
    node: {
      setImmediate: false,
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    },
  }
}

