const Decimal = require('decimal.js')

const Crypto = require('crypto')

const WebSocket = require('ws')

const EventEmitter = require('events')

const webSocketURL = 'wss://max-stream.maicoin.com/ws'

const subscribeAction = 'subscribe'

const accessKey_ = require('../../config.js').accesskey
const secretKey_ = require('../../config.js').secretKey

class WebSocketAPI extends EventEmitter {
  /**
   * Initialize a WebSocket connection
   *
   * @constructor
   * @param {Object} options
   * @param {string} [options.accessKey]
   * @param {string} [options.secretKey]
   * @param {number} [options.depth]
   */
  constructor (options = {
    accessKey: accessKey_, secretKey: secretKey_, depth: 5
  }) {
    super() // inherit

    const { accessKey, secretKey } = options
    this._accessKey = accessKey
    this._secretKey = secretKey
    this._subscriptions = []
    this.orderBookDepth = 5 // defau;t
  }

  /**
   * Connect creates the websocket connection and setup the message handlers.
   */
  connect () {
    // create the connection and setup the handlers
    this._ws = new WebSocket(webSocketURL, {})
    this._ws.on('open', this._handleOpen.bind(this))
    this._ws.on('message', this._handleMessage.bind(this))
  }

  /**
   * Add subscription to the websocket session.
   * The subscription messages will be sent to the server when `connect` method is called.
   *
   * @constructor
   * @param {string} channel The public market data channel. valid channels are: 'kline', 'trade', 'book'
   * @param {string} market The market name of the subscription. the given string should be in lower-case
   * @param {string} [options] The options of the subscription
   * @param {number} [options.depth] The depth of the book data. defaults to the whole book.
   * @param {string} [options.interval] The interval of the kline data.
   */
  subscribe (channel, market, options = {}) {
    this._subscriptions.push({
      channel,
      market,
      depth: options.depth
      // resolution: (options.interval ? options.interval : options.resolution)
    })
    this.orderBookDepth = options.depth // renew orderbook depth
  }

  _sendSubscriptions (action) {
    if (this._subscriptions.length > 0) {
      this._ws.send(JSON.stringify({ action, subscriptions: this._subscriptions }))
    }
  }

  // when connect is on
  _handleOpen () {
    // private
    if (this._secretKey && this._accessKey) {
      this._sendAuth()
    }
    // public
    this._sendSubscriptions(subscribeAction)
  }

  _sendAuth () {
    const hmac = Crypto.createHmac('sha256', this._secretKey)
    const nonce = Date.now()
    console.log(`websocket ${nonce}`)
    const signature = hmac.update(nonce.toString()).digest('hex')
    this._ws.send(JSON.stringify({
      action: 'auth',
      apiKey: this._accessKey,
      signature,
      nonce,
      filters: ['order', 'trade']
    }))
  }

  _handleMessage (body) {
    const obj = JSON.parse(body)
    // receive packet
    this.emit('raw', body)

    // just to make the key alias here
    const { e: eventType, M: market, c: channel, T: millisecondTimestamp } = obj

    // private messages are from the user channel
    if (channel === 'user') {
      switch (eventType) {
        case 'order_snapshot': {
          // this.emit('order.snapshot')
          console.log('order_snapshot', parseOrder(obj.o))
          break
        }
        case 'order_update' : {
          this.emit('order.update', parseOrder(obj.o))
          console.log('order.update', obj.o)
          break
        }
        case 'trade_update': {
          this.emit('trade.update', parseTrades(obj.t))
          console.log('trade_update', parseTrades(obj.t))
          break
        }
        case 'trade_snapshot':

          this.emit('trader_snapshot', parseTrades(obj.t))
          // console.log("trade_snapshot", obj.t)
          break

        case 'account_update': {
          break
        }
        case 'account_snapshot':
          this.emit(eventType.replace('_', '.'), parseBalances(obj.B))
          // this.emit('user.' + eventType.replace('_', '.'), parseBalances(obj.B))
          break
      }
      return
    }

    // public channel
    switch (eventType) {
      case 'error':
        this.emit('error', obj.E)
        break

      case 'authenticated':
        this.emit('authenticated')
        break

      case 'subscribed':
        // emit the "subscribed" payload
        // {"e":"subscribed","s":[{"channel":"book","market":"btctwd","depth":10}],"i":"","T":1614299699417}
        this.emit('subscribed', {
          subscriptions: obj.s,
          time: new Date(millisecondTimestamp)
        })
        break

      case 'update': {
        switch (channel) {
          case 'book': {
            console.log('receive book update', Date.now())
            this.emit('book.update', {
              market,
              bids: parsePriceVolumes(obj.b),
              asks: parsePriceVolumes(obj.a)
            })

            break
          }
        }
        break
      }

      case 'snapshot':
        // "a": asks
        // "b": bids
        switch (channel) {
          case 'book':
            console.log(`receive book snapshot ${Date.now()}`)
            // console.log(obj.a.length, obj.b.length, this.orderBookDepth)
            if (obj.b.length !== this.orderBookDepth || obj.a.length !== this.orderBookDepth) { console.log('book snapshot received '); break }

            this.emit('book.snapshot', {

              market,
              bids: parsePriceVolumes(obj.b),
              asks: parsePriceVolumes(obj.a),
              time: new Date(millisecondTimestamp)
            })
            break

          case 'kline':
            this.emit(channel + '.' + eventType, {
              market,
              startTime: new Date(obj.k.ST),
              endTime: new Date(obj.k.ET),
              interval: obj.k.R,
              open: new Decimal(obj.k.O),
              high: new Decimal(obj.k.H),
              low: new Decimal(obj.k.L),
              close: new Decimal(obj.k.C),
              volume: new Decimal(obj.k.v),
              tradeID: new Decimal(obj.k.ti),
              closed: obj.k.x,

              // event time
              time: new Date(millisecondTimestamp)
            })
            break

          case 'trade':
            const trades = parseTrades(obj.t)
            this.emit(channel + '.' + eventType, {
              market,
              trades,
              // event time
              time: new Date(millisecondTimestamp)
            })
            break
        }
        break
    }
  }
}

function parseOrder (orders) {
  let price_ = 0
  let rv_ = ''
  return orders.map((o) => {
    if (o.ot === 'limit') {
      price_ = new Decimal(parseFloat(o.p))
      rv_ = new Decimal(parseFloat(o.rv))
    } else {
      // market order
      price_ = new Decimal(parseFloat(o.ap))
      rv_ = new Decimal(0.0)
    }
    return {
      id: o.i,
      orderType: o.ot,
      price: price_,
      volume: new Decimal(parseFloat(o.v)),
      remainVol: rv_,
      market: o.M,
      side: o.sd,
      time: new Date(o.T),
      state: o.S
    }
  })
}

function parseTrades (trades) {
  return trades.map((o) => {
    return {
      price: new Decimal(o.p),
      volume: new Decimal(o.v),
      time: new Date(o.T),
      side: o.sd,
      maker: o.m,
      market: o.M,
      trend: o.tr === 'up' ? 1 : -1
    }
  })
}

function parseBalances (objs) {
  return objs.map((o) => {
    return {
      currency: o.cu,
      available: new Decimal(o.av),
      locked: new Decimal(o.l)
    }
  })
}

function parsePriceVolumes (pvs) {
  return pvs.map((pv) => { return { price: new Decimal(pv[0]), volume: new Decimal(pv[1]) } })
}

module.exports = WebSocketAPI
