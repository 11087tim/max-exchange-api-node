
const WebSocketAPI = require('./lib/transports/websocket')
const WebSocketBook = require('./lib/websocket_book')
// const checkBalance = require('./lib/myfunction/checkBalance.js')
// const RestV2 = require('./lib/transports/rest_v2.js')

const accesskey = require('./config.js').accesskey
const secretKey = require('./config.js').secretKey
const tradingPair = 'usdttwd'
const bookDepth = 5 // default
const ws = new WebSocketAPI({ accessKey: accesskey, secretKey: secretKey
})
const book = new WebSocketBook(ws, tradingPair, bookDepth)

// book.onUpdate(() => {
//   book.pretty()
// })

// API on
ws.on('error', (errors) => {
  console.error(errors)
})
