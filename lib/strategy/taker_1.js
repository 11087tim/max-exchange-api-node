const Decimal = require('decimal.js')
const customOrder = require('../myfunction/placeOrder.js')

/**
 * deal with inbalance of tier one price
 * @param {object} askVolStructure
 * @param {object} bidVolStructure
 */

async function takerOne (askVolStructure, bidVolStructure, Account) {
  console.log('T1')

  const volStatus = (askVolStructure.ourVol).dividedBy(bidVolStructure.ourVol)

  if (volStatus < 0.67) {
    // buy side inbalance = sell order
    let takerVol = new Decimal((((bidVolStructure.ourVol).minus((askVolStructure.ourVol))).dividedBy(4)).toString())
    // console.log(`taker1 sell order ${takerVol}`)
    console.log(`taker1-1 : ${Date.now()}, ${takerVol}`)
    customOrder(askVolStructure.tradingPair, takerVol, 'sell', bidVolStructure.price, 'market', bidVolStructure, Account)
  } else if (volStatus > 1.5) {
    // sell side inbalance
    let takerVol = new Decimal((((askVolStructure.ourVol).minus((bidVolStructure.ourVol))).dividedBy(4)).toString())
    console.log(`taker1-2 : ${Date.now()}, ${takerVol}`)
    // console.log(`taker1 buy order ${takerVol}`)
    customOrder(bidVolStructure.tradingPair, takerVol, 'buy', askVolStructure.price, 'market', askVolStructure, Account)
  }
}

module.exports = takerOne
