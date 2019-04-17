const Hapi = require('hapi')
const path = require('path')
const inert = require('inert')

const server = Hapi.server({
  port: 3000,
  host: 'localhost',
  routes: {
    cors: {
        origin: ['*']
    }
  }
})

const client = Hapi.server({
  port: 3002,
  host: 'localhost',
  routes: {
    files: {
      relativeTo: path.join(__dirname, 'public')
    }
  }
})

server.route({
  path: '/api/welcome/{name}',
  method: 'GET',
  handler (request) {
      return {
          code: 200,
          success: true,
          data: {
              msg: `hi ${request.params.name}`
          }
      }
  }
})


server.state('login', {
  ttl: null, // 时效
  isSecure: false, // https
  isHttpOnly: false, // http Only
  encoding: 'none', // encode
  clearInvalid: false, // 移除不可用的 cookie
  strictHeader: true // 不允许违反 RFC 6265
})

const init = async () => {
  await client.register(inert)
  
  server.route({
    path: '/api/login',
    method: 'POST',
    handler (request, h) {
        let body
        let code
        // 获取 cookie
        const isLogin = request.state.login
        if (isLogin) {
            body = {
                msg: '已登录'
            }
            code = 200
        } else if (request.payload && request.payload.email === 'kenny@gmail.com' && request.payload.password === '123456') {
            // 设置 cookie
            h.state('login', 'true')
            body = {
                msg: '登录成功'
            }
            code = 200
        } else {
            code = 100
            body = {
                msg: '登录信息有误'
            }
        }
        return {
            code,
            success: true,
            data: body
        }
    }
  })
  server.route({
    path: '/api/logout',
    method: 'POST',
    handler (request, h) {
        // 取消 cookie
        h.unstate('login')
        return {
            code: 200,
            success: true
        }
    }
  })

  client.route({
    path: '/{param*}',
    method: 'GET',
    handler: {
      directory: {
        path: '.',
        index: true,
        defaultExtension: 'html'
      }
    }
  })
  
  await server.start()
  await client.start()
  console.log(`Server running at: ${server.info.uri}`)
  console.log(`Client running at: ${client.info.uri}`)
}

init()