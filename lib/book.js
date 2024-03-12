const RBTree = require('bintrees').RBTree
const EventEmitter = require('events')
const Decimal = require('decimal.js')

function comparePriceEntry (a, b) {
  return a.price.cmp(b.price)
}

class Book {
  constructor () {
    this._bids = new RBTree(comparePriceEntry)
    this._asks = new RBTree(comparePriceEntry)
    this.tradingPair = 'usdttwd'
    this.makerStrategy = new EventEmitter()
    this.takerStrategy = new EventEmitter()

    this.askVolStructure = {

      ourVol: 0,
      // VolBehind : 0,
      price: 0,
      tradingPair: this.tradingPair,
      currency: 'usdt'
    }
    this.bidVolStructure = {

      ourVol: 0,
      // VolBehind : 0,
      price: 0,
      tradingPair: this.tradingPair,
      currency: 'twd'
    }
  }

  _priceVolumeUpdater (pvs) {
    return function (pv) {
      if (pv.volume.isZero()) {
        pvs.remove(pv)
      } else {
        const o = pvs.find(pv)
        if (o) {
          o.volume = pv.volume
        } else {
          pvs.insert(pv)
        }
      }
    }
  }

  reset () {
    this._bids = new RBTree(comparePriceEntry)
    this._asks = new RBTree(comparePriceEntry)
  }

  load (snapshot) {
    this.reset()
    snapshot.bids.forEach((pv) => this._bids.insert(pv))
    snapshot.asks.forEach((pv) => this._asks.insert(pv))
  }

  update (update) {
    update.asks.forEach(this._priceVolumeUpdater(this._asks))
    update.bids.forEach(this._priceVolumeUpdater(this._bids))
    try {
      // console.log(this.bestAsk(), this.bestBid())
      this.askVolStructure.price = new Decimal(parseFloat(this._asks.min().price))
      this.askVolStructure.ourVol = new Decimal(parseFloat(this._asks.min().volume))

      this.bidVolStructure.price = new Decimal(parseFloat(this._bids.max().price))
      this.bidVolStructure.ourVol = new Decimal(parseFloat(this._bids.max().volume))

      // check
      console.log('------------------', 'new orderbook update', '-------------------')
      console.log(this.askVolStructure.price, this.askVolStructure.ourVol, this.bidVolStructure.price, this.bidVolStructure.ourVol)
      // send emitter
      // console.log(`send maker emitter ${Date.now()}`)
      setTimeout(() => { this.makerStrategy.emit('maker') }, 1)
      // this.makerStrategy.emit('maker')
    } catch (error) {
      console.log('error when update orderBook data : ', error)
    }
  }

  bestAsk () {
    return this._asks.min()
  }

  bestBid () {
    return this._bids.max()
  }

  spread () {
    const ask = this.bestAsk()
    const bid = this.bestBid()
    return ask.price - bid.price
  }

  pretty () {
    let item
    const askIt = this._asks.iterator()
    while ((item = askIt.prev()) !== null) {
      console.log('ask ', item.price, item.volume)
    }

    console.log('------------------', 'spread', this.spread().toFixed(3), '-------------------')

    const bidIt = this._bids.iterator()
    while ((item = bidIt.prev()) !== null) {
      console.log('bid ', item.price, item.volume)
    }
  }
}

module.exports = Book
