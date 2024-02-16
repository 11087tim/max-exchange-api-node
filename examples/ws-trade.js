const WebSocketAPI = require('../lib/transports/websocket')

const ws = new WebSocketAPI({ accessKey: 'aKyHoMYl835uxKK8G14EZV6MxhcByVYxBY0uNRZJ', secretKey: 'XhRZXwvPzGlDzPp1ScInWbfZhxihQzyGJTd4Li82' })

ws.subscribe('trade', 'usdttwd')

ws.on('trade.snapshot', (e) => { console.log(e) })
ws.on('trade.update', (e) => { console.log(e) })

ws.on('raw', (body) => console.log(body))
ws.on('error', (errors) => {
  console.error(errors)
})

ws.connect()
