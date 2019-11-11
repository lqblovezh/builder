const urlJoin = require('url-join')

module.exports = function({
  projectConfigs,
  projectFilter,
  apps,
}) {
  if (projectFilter) {
    projectConfigs = projectConfigs.filter(projectFilter)
  }
  return projectConfigs.map(projectConfig => {
    const list = apps.filter(item => {
      if (item.template && projectConfig.suffix) {
        return item.template == projectConfig.suffix
      }
      return item.type == projectConfig.type
    })

    projectConfig.active = list.length > 0

    const appPaths = list == false ? ['/' + projectConfig.type] : list.map(item => item.base_url)
    projectConfig.routeInfos = appPaths.map(appPath => {
      let routePath = appPath
      if (projectConfig.admin) {
        routePath = urlJoin(routePath, 'admin')
      }
      if (projectConfig.spa) {
        routePath = urlJoin(routePath, 'app')
      } else if (projectConfig.design == 'phone') {
        routePath = urlJoin(routePath, 'h5')
      }
      return {
        projectConfig,
        appPath,
        routePath,
      }
    })
    return projectConfig
  })
}
