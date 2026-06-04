require('dotenv').config()
const fs = require('fs')
const path = require('path')
const express = require('express')
const request = require('./util/request')
const cache = require('./util/apicache').middleware
const { cookieToJson } = require('./util/index')
const decode = require('safe-decode-uri-component')
const logger = require('./util/logger.js')

/**
 * @typedef {{
 *   identifier?: string,
 *   route: string,
 *   module: any
 * }} ModuleDefinition
 */

/**
 * @typedef {{
 *   port?: number,
 *   host?: string,
 *   moduleDefs?: ModuleDefinition[]
 * }} NcmApiOptions
 */

/**
 * Get the module definitions dynamically.
 */
async function getModulesDefinitions(
  modulesPath,
  specificRoute,
  doRequire = true,
) {
  const files = await fs.promises.readdir(modulesPath)
  const parseRoute = (/** @type {string} */ fileName) =>
    specificRoute && fileName in specificRoute
      ? specificRoute[fileName]
      : `/${fileName.replace(/\.js$/i, '').replace(/_/g, '/')}`

  const modules = files
    .reverse()
    .filter((file) => file.endsWith('.js'))
    .map((file) => {
      const identifier = file.split('.').shift()
      const route = parseRoute(file)
      const modulePath = path.join(modulesPath, file)
      const module = doRequire ? require(modulePath) : modulePath

      return { identifier, route, module }
    })

  return modules
}

function parseCorsAllowOrigins(corsAllowOrigin) {
  if (!corsAllowOrigin) {
    return null
  }

  const origins = corsAllowOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return origins.length > 0 ? origins : null
}

function getCorsAllowOrigin(allowOrigins, requestOrigin) {
  if (!allowOrigins) {
    return requestOrigin || '*'
  }

  if (allowOrigins.includes('*')) {
    return '*'
  }

  if (requestOrigin && allowOrigins.includes(requestOrigin)) {
    return requestOrigin
  }

  return null
}

/**
 * Construct the server of NCM API.
 */
async function constructServer(moduleDefs) {
  const app = express()
  const { CORS_ALLOW_ORIGIN } = process.env
  const allowOrigins = parseCorsAllowOrigins(CORS_ALLOW_ORIGIN)
  app.set('trust proxy', true)

  /**
   * Serving static files — renderer/ is the SPA frontend
   */
  app.use(express.static(path.join(__dirname, 'renderer')))
  app.use(express.static(path.join(__dirname, 'public')))

  /**
   * CORS & Preflight request
   */
  app.use((req, res, next) => {
    if (req.path !== '/' && !req.path.includes('.')) {
      const corsAllowOrigin = getCorsAllowOrigin(
        allowOrigins,
        req.headers.origin,
      )
      const shouldSetVaryHeader = corsAllowOrigin && corsAllowOrigin !== '*'
      res.set({
        'Access-Control-Allow-Credentials': true,
        ...(corsAllowOrigin
          ? { 'Access-Control-Allow-Origin': corsAllowOrigin }
          : {}),
        ...(shouldSetVaryHeader ? { Vary: 'Origin' } : {}),
        'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
        'Content-Type': 'application/json; charset=utf-8',
      })
    }
    req.method === 'OPTIONS' ? res.status(204).end() : next()
  })

  /**
   * Cookie Parser
   */
  app.use((req, _, next) => {
    req.cookies = {}
    ;(req.headers.cookie || '').split(/;\s+|(?<!\s)\s+$/g).forEach((pair) => {
      let crack = pair.indexOf('=')
      if (crack < 1 || crack == pair.length - 1) return
      req.cookies[decode(pair.slice(0, crack)).trim()] = decode(
        pair.slice(crack + 1),
      ).trim()
    })
    next()
  })

  /**
   * Body Parser
   */
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  /**
   * Cache
   */
  app.use(cache('2 minutes', (_, res) => res.statusCode === 200))

  /**
   * Special Routers
   */
  const special = {
    'daily_signin.js': '/daily_signin',
    'fm_trash.js': '/fm_trash',
    'personal_fm.js': '/personal_fm',
  }

  /**
   * Load every modules in this directory
   */
  const moduleDefinitions =
    moduleDefs ||
    (await getModulesDefinitions(path.join(__dirname, 'module'), special))

  for (const moduleDef of moduleDefinitions) {
    app.all(moduleDef.route, async (req, res) => {
      ;[req.query, req.body].forEach((item) => {
        if (item && typeof item.cookie === 'string') {
          item.cookie = cookieToJson(decode(item.cookie))
        }
      })

      let query = Object.assign(
        {},
        { cookie: req.cookies },
        req.query,
        req.body,
        req.files,
      )

      try {
        const moduleResponse = await moduleDef.module(query, (...params) => {
          const obj = [...params]
          const options = obj[2] || {}
          let ip = ''

          if (options.randomCNIP) {
            ip = global.cnIp
          } else {
            ip = req.ip

            if (ip.substring(0, 7) == '::ffff:') {
              ip = ip.substring(7)
            }
            if (ip == '::1') {
              ip = global.cnIp
            }
          }

          obj[2] = {
            ...options,
            ip,
          }

          return request(...obj)
        })
        logger.info(`Request Success: ${decode(req.originalUrl)}`)

        // General unblock support for song/url/v1
        if (
          req.baseUrl === '/song/url/v1' &&
          process.env.ENABLE_GENERAL_UNBLOCK === 'true'
        ) {
          const song = moduleResponse.body.data[0]
          if (
            song.freeTrialInfo !== null ||
            !song.url ||
            [1, 4].includes(song.fee)
          ) {
            const {
              matchID,
            } = require('@neteasecloudmusicapienhanced/unblockmusic-utils')
            logger.info('Starting unblock(uses general unblock):', req.query.id)
            const result = await matchID(req.query.id)
            song.url = result.data.url
            song.freeTrialInfo = null
            logger.info('Unblock success! url:', song.url)
          }
          if (song.url && song.url.includes('kuwo')) {
            const proxy = process.env.PROXY_URL
            const useProxy = process.env.ENABLE_PROXY || 'false'
            if (useProxy === 'true' && proxy) {
              song.proxyUrl = proxy + song.url
            }
          }
        }

        const cookies = moduleResponse.cookie
        if (!query.noCookie) {
          if (Array.isArray(cookies) && cookies.length > 0) {
            if (req.protocol === 'https') {
              res.append(
                'Set-Cookie',
                cookies.map((cookie) => {
                  return cookie + '; SameSite=None; Secure'
                }),
              )
            } else {
              res.append('Set-Cookie', cookies)
            }
          }
        }
        if (moduleResponse.redirectUrl) {
          res.redirect(moduleResponse.status || 302, moduleResponse.redirectUrl)
          return
        }

        res.status(moduleResponse.status).send(moduleResponse.body)
      } catch (/** @type {*} */ moduleResponse) {
        logger.error(`${decode(req.originalUrl)}`, {
          status: moduleResponse.status,
          body: moduleResponse.body,
        })
        if (!moduleResponse.body) {
          res.status(404).send({
            code: 404,
            data: null,
            msg: 'Not Found',
          })
          return
        }
        if (moduleResponse.body.code == '301')
          moduleResponse.body.msg = '需要登录'
        if (!query.noCookie) {
          res.append('Set-Cookie', moduleResponse.cookie)
        }

        res.status(moduleResponse.status).send(moduleResponse.body)
      }
    })
  }

  return app
}

/**
 * Serve the NCM API.
 * @param {NcmApiOptions} options
 * @returns {Promise<import('express').Express>}
 */
async function serveNcmApi(options) {
  const port = Number(options.port || process.env.PORT || '15678')
  const host = options.host || process.env.HOST || '0.0.0.0'

  const app = await constructServer(options.moduleDefs)

  app.listen(port, host, () => {
    console.log(`
  ╔═╗╦ ╦╦═╗╦╔═╗╦ ╦
  ╠═╝║ ║╠╦╝║╠╣ ╚╦╝
  ╩  ╚═╝╩╚═╩╚   ╩
    `)
    logger.info(`Purify server started @ http://${host}:${port}`)
    logger.info(`Open http://localhost:${port} in Chrome`)
  })

  return app
}

module.exports = {
  serveNcmApi,
  getModulesDefinitions,
}
