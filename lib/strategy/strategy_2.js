const customOrder = require('../myfunction/placeOrder.js')
const Decimal = require('decimal.js')

// single order 2mil

async function StrategyTwo (askVolStructure, bidVolStructure, Account, spread = 0.002) {
  console.log('ST2')

  // check base currency balance

  // check trending
  const volStatus = askVolStructure.ourVol.dividedBy(bidVolStructure.ourVol)
  // between 0.45 ~ 0.55
  if (volStatus >= 0.67 && volStatus <= 1.5) {
    // no distict trend
    if (Account.askBalance > Account.bidBalance) {
      // sell order
      const sellPrice = askVolStructure.price.minus(0.001)
      customOrder(askVolStructure.tradingPair, new Decimal('7874'), 'sell', sellPrice, 'limit', askVolStructure, Account)
      setTimeout(() => {
        const buyPrice = bidVolStructure.price
        customOrder(bidVolStructure.tradingPair, new Decimal('3927'), 'buy', buyPrice, 'limit', bidVolStructure, Account)
      }, 1)
      // buy order
    } else {
      // buy order
      const buyPrice = bidVolStructure.price.minus(0.001)
      customOrder(bidVolStructure.tradingPair, new Decimal('7874'), 'buy', buyPrice, 'limit', bidVolStructure, Account)

      // sell order
      setTimeout(() => {
        customOrder(askVolStructure.tradingPair, new Decimal('3927'), 'sell', askVolStructure.price, 'limit', askVolStructure, Account)
      }, 1)
    }
  } else if (volStatus > 1.5) {
    // buy order
    const buyPrice = bidVolStructure.price.minus(0.001)
    customOrder(bidVolStructure.tradingPair, new Decimal('7874'), 'buy', buyPrice, 'limit', bidVolStructure, Account)
    setTimeout(() => { // place sell order
      customOrder(askVolStructure.tradingPair, new Decimal('3927'), 'sell', askVolStructure.price, 'limit', askVolStructure, Account)
    }, 1)
  } else {
    // buying trend
    // sell order
    const sellPrice = askVolStructure.price.minus(0.001)
    customOrder(askVolStructure.tradingPair, new Decimal('7874'), 'sell', sellPrice, 'limit', askVolStructure, Account)
    setTimeout(() => { // buy order
      customOrder(bidVolStructure.tradingPair, new Decimal('3927'), 'buy', bidVolStructure.price, 'limit', bidVolStructure, Account)
    }, 1)
  }
}

module.exports = StrategyTwo
