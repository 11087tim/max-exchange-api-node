// const { parse } = require('path')
// const EventEmitter = require('events')

const Book = require('./book')
const Mutex = require('async-mutex').Mutex
const Decimal = require('decimal.js')
const checkBalance = require('./myfunction/checkBalance.js')
const RestV2 = require('./transports/rest_v2.js')

class WebSocketBook extends Book {
  constructor (ws, market, depth = null) {
    super()

    this.market = market
    this._ws = ws

    // usdt : 917.07321374
    // twd : 975.585574
    // about balance (twd)
    this.Account = {
      // for balance
      makerSellBalance: new Decimal('0.0'), // 103170
      makerBuyBalance: new Decimal('0.0'), // 103170
      takerSellBalance: new Decimal('0.0'), // 15870
      takerBuyBalance: new Decimal('0.0'), // 15870

      // for record
      makerVol: new Decimal('0.0'),
      takerVol: new Decimal('0.0'),
      index: 0

    }
    this.initBal()

    this._ws.subscribe('book', market, {depth})
    this._ws.on('book.snapshot', this.handleSnapshot.bind(this)) // !
    this._ws.on('book.update', this.handleUpdate.bind(this))
    // about finished trade
    this._ws.on('trade.snapshot', () => { console.log('got trader snapshot') })
    this._ws.on('trade.update', this.tradeUpdate.bind(this))
    // about pending orders
    // this._ws.on('order.snapshot' , this.cancelorders.bind(this))
    this._ws.on('order.update', this.orderUpdate.bind(this))
    //  about maker
    this.makerStrategy.on('maker', this._makerStrategy.bind(this))
    // about taker
    this.takerStrategy.on('taker', this._takerStrategy.bind(this))

    // about record
    this.record()

    this._onUpdates = []
    this.mutex = new Mutex() // thread lock

    this.cancelorders_() // check orders
    this.restoreBalance() // check balance
  }

  onUpdate (cb) {
    this._onUpdates.push(cb)
  }

  handleUpdate (e) {
    // console.log("handleupdate:", e)
    const book = this
    this.update(e)
    this._onUpdates.forEach((cb) => cb(book))
  }

  handleSnapshot (e) {
    // console.log("handlesnapshot", e)
    const book = this
    this.load(e)
    this._onUpdates.forEach((cb) => cb(book))
    console.log('book snapshot done')
  }

  // check balance
  restoreBalance () {
    setInterval(() => {
      this.mutex
        .runExclusive(() => {
          const api = new RestV2()
          api.account('twd')
            .then((response) => {
              console.log(response)
              this.Account.makerBuyBalance = new Decimal(new Decimal(response.balance).dividedBy(31.6).toString())
              console.log(`Buy balance restore ${this.Account.makerBuyBalance}`)
              api.account('usdt')
                .then((response) => {
                  console.log(response)
                  this.Account.makerSellBalance = new Decimal(response.balance)
                  console.log(`Sell balance restore ${this.Account.makerSellBalance}`)
                })
            })
        })
        .then((result) => {
          console.log(result)
        })
    }, 15000)
  }
  // balance init
  initBal () {
    let twdBal = {
      value: 0
    }
    let usdtBal = {
      value: 0
    }
    checkBalance('twd', twdBal)
      .then(() => {
        checkBalance('usdt', usdtBal)
          .then(() => {
            let params = {
              market: 'usdttwd',
              side: '',
              volume: 0,
              ordType: 'market'
            }
            twdBal.value = twdBal.value / 31.5
            if (usdtBal.value > twdBal.value) {
              params.volume = ((usdtBal.value - twdBal.value) / 2).toString()
              params.side = 'sell'
            } else {
              params.volume = ((twdBal.value - usdtBal.value) / 2).toString()
              params.side = 'buy'
            }

            const api = new RestV2()
            try {
              api.placeOrder(params)
                .then((response) => {
                // Access the response here
                  console.log('balance rebalance', response)
                  // check balance
                  api.account('twd')
                    .then((response) => {
                      console.log(response)
                      this.Account.makerBuyBalance = new Decimal(response.balance)
                      this.Account.makerBuyBalance = new Decimal(this.Account.makerBuyBalance.dividedBy(31.6))
                      console.log(this.Account.makerBuyBalance)
                      api.account('usdt')
                        .then((response) => {
                          console.log(response)
                          this.Account.makerSellBalance = new Decimal(response.balance)
                          console.log(this.Account.makerSellBalance)
                          this._ws.connect()
                        })
                    })

                // this._ws.connect()
                })
                .catch((error) => {
                  console.error(error.message)
                // this._ws.connect()
                })
            } catch (customError) {
              console.error(customError.message)
            }
          })
      })
  }

  // record
  record () {
    const records = require('./myfunction/record.js')
    records(this.Account.makerVol, this.Account.takerVol, this.Account)

    // loop
    setInterval(() => {
      this.mutex
        .runExclusive(() => {
          records(this.Account.makerVol, this.Account.takerVol, this.Account)
        })
        .then((result) => {
          console.log(result)
        })
    }, 120000)
  }
  // cancel off target orders
  cancelorders_ () {
    const cancelorder = require('./myfunction/cancelorder.js')

    setInterval(() => {
      cancelorder(this.askVolStructure.price, this.bidVolStructure.price, this.Account)
    }, 10000)
  }

  // cancel iff target orders &
  orderUpdate (e) {
    // check orders
    const updateOrders = require('./myfunction/checkOrders.js')

    this.mutex.runExclusive(() => {
      console.log('run orderupdate')
      updateOrders(this.tradingPair, e, this.askVolStructure.price, this.bidVolStructure.price, this.Account, 0)
      console.log('end order update')
    })
      .then((result) => {
        console.log(result)
      })
  }

  tradeUpdate (e) {
    // finished  orders
    this.mutex
      .runExclusive(() => {
        for (let i = 0; i < e.length; i++) {
          if (e[i].market === this.tradingPair) {
            if (e[i].side === 'bid' && !e[i].maker) {
              // taker
              console.log(`bal bid (taker) ${this.Account.takerSellBalance}, ${this.Account.takerBuyBalance}`)
              this.Account.takerSellBalance = new Decimal(this.Account.takerSellBalance).plus(e[i].volume)
              this.Account.takerBuyBalance = new Decimal(this.Account.takerBuyBalance).minus(e[i].volume)
              this.Account.takerVol = new Decimal(this.Account.takerVol).plus(e[i].volume)
            } else if (e[i].side === 'ask' && !e[i].maker) {
              // sell
              // taker
              console.log(`bal ask (taker) ${this.Account.takerSellBalance}, ${this.Account.takerBuyBalance}`)
              this.Account.takerSellBalance = new Decimal(this.Account.takerSellBalance).minus(e[i].volume)
              this.Account.takerBuyBalance = new Decimal(this.Account.takerBuyBalance).plus(e[i].volume)
              this.Account.takerVol = new Decimal(this.Account.takerVol).plus(e[i].volume)
            }
          }
        }
        console.log(`WS orders check : ${this.Account.makerSellBalance}, ${this.Account.makerBuyBalance}, ${this.Account.takerSellBalance}, ${this.Account.takerBuyBalance}, ${this.Account.makerVol}, ${this.Account.takerVol}`)
      })
      .then((result) => {
        console.log(result)
      })
  }

  _makerStrategy () {
    this.mutex
      .runExclusive(() => {
        console.log('makerSellBal:', this.Account.makerSellBalance, 'makerBuyBal:', this.Account.makerBuyBalance)

        let spread = (this.askVolStructure.price).minus(this.bidVolStructure.price).toString()
        console.log(`spread:${spread}`)
        switch (spread) {
          case '0.001' : {
            // st1
            console.log('st1')
            const ST1 = require('./strategy/strategy_1.js')
            ST1(this.askVolStructure, this.bidVolStructure, this.Account)

            // start taker
            // setTimeout(() => { this.takerStrategy.emit('taker') }, 2)
            break
          }
          case '0.002' : {
            // ST2
            console.log('st2')
            const ST2 = require('./strategy/strategy_2.js')
            ST2(this.askVolStructure, this.bidVolStructure, this.Account)
            // start taker
            // setTimeout(() => { this.takerStrategy.emit('taker') }, 2)
            break
          }
          default : {
            console.log(`${spread}, st3`)
            if (parseFloat(spread) > 0.002) {
              // bigger than 0.002
              // ST3
              const ST3 = require('./strategy/strategy_3.js')
              ST3(this.askVolStructure, this.bidVolStructure, this.Account, spread)

              // start taker
              // setTimeout(() => { this.takerStrategy.emit('taker') }, 2)
              break
            }
          }
        }
      })
      .then((result) => {
        console.log(result)
      })
  }

  _takerStrategy () {
    console.log('takerSellbal:', this.Account.takerSellBalance, 'takerBuyBal:', this.Account.takerBuyBalance)

    const taker1 = require('./strategy/taker_1.js')
    taker1(this.askVolStructure, this.bidVolStructure, this.Account)

    const rebalance = require('./strategy/takerRebalance.js')
    setTimeout(() => {
      rebalance(this.Account, this.askVolStructure, this.bidVolStructure)
      console.log('------------------', 'End one round', '-------------------')
    }, 1)
  }
}

module.exports = WebSocketBook
