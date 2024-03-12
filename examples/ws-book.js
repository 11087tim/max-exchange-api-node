const WebSocketAPI = require('../lib/transports/websocket')
const WebSocketBook = require('../lib/websocket_book')

const ws = new WebSocketAPI({ accessKey: 'aKyHoMYl835uxKK8G14EZV6MxhcByVYxBY0uNRZJ', secretKey: 'XhRZXwvPzGlDzPp1ScInWbfZhxihQzyGJTd4Li82' })
const book = new WebSocketBook(ws, 'usdttwd', 10)

book.onUpdate((book) => {
  book.pretty()
})

ws.on('error', (errors) => {
  console.error(errors)
})
// ws.on('raw', (body) => console.log(body) )
ws.connect()
