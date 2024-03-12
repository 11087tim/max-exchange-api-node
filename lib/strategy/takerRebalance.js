const customOrder = require('../myfunction/placeOrder.js')
const Decimal = require('decimal.js')

async function takerRebalance (Account, askVolStructure, bidVolStructure) {
  console.log('taker2')

  const balanceStatus = Account.takertSellBalance / (Account.takerBuyBalance)

  if (balanceStatus < 0.67) {
    // not enough in sell balance => take sell side => buy order (market)
    let vol = new Decimal(Account.takerBuyBalance.minus(Account.takertSellBalance).dividedBy(2).toString())
    console.log(`taker2-1 : ${Date.now()}`)
    customOrder(bidVolStructure.tradingPair, vol, 'buy', askVolStructure.price, 'market', askVolStructure, Account)
  } else if (balanceStatus > 1.5) {
    // not enough in buy balance => take sell side => sell order (market)
    let vol = new Decimal(Account.takertSellBalance.minus(Account.takerBuyBalance).dividedBy(2).toString())
    console.log(`taker2-2 : ${Date.now()}`)
    customOrder(askVolStructure.tradingPair, vol, 'buy', bidVolStructure.price, 'market', bidVolStructure, Account)
  }
}
module.exports = takerRebalance
