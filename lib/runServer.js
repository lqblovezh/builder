const path = require('path')
const express = require('express')
const webpack = require('webpack')
const webpackDev = require('webpack-dev-middleware')
const webpackHot = require('webpack-hot-middleware')
const proxy = require('http-proxy-middleware')
const pug = require('pug')
const urlJoin = require('url-join')
const fetch = require('isomorphic-fetch-improve')
const pify = require('pify')
const arrayFlatten = require('array-flatten')
const { appendIndexFile } = require('update-pathname')
const ip = require('ip')
const open = require('open');
const portfinder = require('portfinder');

const attachRouteInfos = require('./attachRouteInfos')
const getDevConfig = require('./getDevConfig')


module.exports = function(opts) {
  const {
    originalSourcePath,
    siteName,
  } = opts

  const projectConfigs = require(path.join(originalSourcePath, 'src/projects/configs'))
  const siteConfigs = require(path.join(originalSourcePath, 'src/common/siteConfigs'))
  const siteConfig = siteConfigs[siteName]
  if (!siteConfig) {
    throw new Error(`服务站点名称（${ siteName }）不存在，可用名称有：${
      Object.keys(siteConfigs).join(', ')
    }`)
  }

  const appBaseUrl = siteConfig[1]
  const projectFilter = siteConfig[2]

  return fetch(urlJoin(appBaseUrl, 'common/api/current'), {
    timeout: 30 * 1000,
    retryMaxCount: 5,
    retryDelay: 10 * 1000,
  }).then(res => res.json()).then(({
    data: {
      publisher: {
        apps
      }
    }
  }) => {
    return run({
      ...opts,
      projectConfigs: attachRouteInfos({
        projectConfigs,
        projectFilter,
        apps,
      }),
      siteConfig
    })
  })
}

async function run({
  originalSourcePath,
  projectConfigs,
  siteConfig,
  suffix,
  port,
}) {
  port = await portfinder.getPortPromise({
      port,    // minimum port
      stopPort: port + 1000 // maximum port
  })
  const baseUrl = `http://${ ip.address() }:${ port }`
  const server = express()
  server.set('view engine', 'pug')
  server.set('views' , path.join(__dirname, 'view'))
  server.use('/cdn', express.static(path.join(originalSourcePath, '../public/cdn')))
  
  const renderConfig = pug.compileFile(
    path.join(originalSourcePath, 'src/common/config_js.pug')
    )
    
    const routeInfos = projectConfigs.reduce((list, projectConfig) => {
      return list.concat(projectConfig.routeInfos)
  }, []).sort((a, b) => a.routePath < b.routePath ? 1 : -1)
  
  var projectGroup = {}
  for (let i =0; i<routeInfos.length; i++){
    let R_type = routeInfos[i].projectConfig.type || 'common'
    if(!projectGroup[R_type]){
      projectGroup[R_type] = []
    }
    projectGroup[R_type].push(routeInfos[i])
  }
  server.get('/', function (req, res) {
    res.render('config', { list:projectGroup })
  })
  routeInfos.forEach(({
    projectConfig,
    routePath,
    appPath,
  }) => {
    let router = null
    server.use(routePath, (req, res, next) => {
      if (req.path == '/') {
        res.redirect(302, appendIndexFile(req.originalUrl))
      } else {
        next()
      }
    })
    server.use(routePath + '/config_js', (req, res) => {
      res.type('application/javascript').end(renderConfig({
        dev: true,
        restUrl: appPath,
        baseUrl,
      }, {
        pretty: true
      }))
    })
    if (projectConfig.spa) {
      server.use(routePath + '/cdn', express.static(path.join(originalSourcePath, '../public/cdn')))
    }
    server.use(routePath, (req, res, next) => {
      if (!router) {
        middleware({
          projectConfig,
          routePath,
          appPath,
          suffix,
          baseUrl,
        }).then(_router => {
          router = _router
          router(req, res, next)
        })
      } else {
        router(req, res, next)
      }
    })
  })
  
  const [sysBaseUrl, appBaseUrl] = siteConfig
  server.all('/system/*', proxy({
    target: sysBaseUrl,
    changeOrigin: true,
  }))
  server.use(proxy({
    target: appBaseUrl,
    changeOrigin: true
  }))

  return pify(server.listen.bind(server))(port).then(() => open(baseUrl))
}

async function middleware({
  projectConfig,
  routePath,
  appPath,
  suffix,
  baseUrl,
}) {
  const router = express.Router()
  router.use('/static', express.static(path.join(projectConfig.projectPath, 'static')))
  const {
    clientConfig,
  } = await getDevConfig({
    projectConfig,
    routePath,
    appPath,
    suffix,
    baseUrl,
  })
  const clientCompiler = webpack(clientConfig)
  const devFn = webpackDev(clientCompiler)
  const hotFn = webpackHot(clientCompiler)
  router.use(devFn)
  router.use(hotFn)
  return router
}

