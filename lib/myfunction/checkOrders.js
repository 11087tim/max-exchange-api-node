const Decimal = require('decimal.js')

function updateOrder (tradingPair, orders, bestAsk, BestBid, Account, index = 0) {
  if (orders.length === index) {
    // end
    console.log('checkorder END : balance check :', Account.makerSellBalance, '|', Account.makerBuyBalance)
    return
  }

  console.log(`check order before, Sell : ${Account.makerSellBalance}, Buy : ${Account.makerBuyBalance}`)

  // check market
  if (orders[index].market === tradingPair) {
    // buy
    if (orders[index].side === 'bid' && orders[index].orderType === 'limit') {
      if (orders[index].volume - orders[index].remainVol === 0 && orders[index].state === 'wait') {
        // first record
        Account.makerBuyBalance = Math.round(new Decimal(Account.makerBuyBalance).minus(orders[index].volume))
        console.log(`updated minus makerBuyBalance : ${orders[index].volume}`)
      } else if (orders[index].remainVol - 0 === 0 && orders[index].state === 'done') {
        Account.makerSellBalance = Math.round(new Decimal(Account.makerSellBalance).plus(orders[index].volume))
        Account.makerVol = Math.round(new Decimal(Account.makerVol).plus(orders[index].volume))
        console.log(`updated plus makerSellBalance and volume : ${orders[index].volume}, ${orders[index].volume}`)
      }
    } else if (orders[index].side === 'ask' && orders[index].orderType === 'limit') {
      // sell
      if (orders[index].volume - (orders[index].remainVol) === 0.0 && orders[index].state === 'wait') {
        // console.log('2')
        Account.makerSellBalance = Math.round(new Decimal(Account.makerSellBalance).minus(orders[index].volume))
        console.log(`updated minus makersellBalance : ${orders[index].volume}`)
      } else if (orders[index].remainVol - 0 === 0 && orders[index].state === 'done') {
        Account.makerBuyBalance = Math.round(new Decimal(Account.makerBuyBalance).plus(orders[index].volume))
        Account.makerVol = Math.round(new Decimal(Account.makerVol).plus(orders[index].volume))
        console.log(`updated plus makerBuyBalance and Volume : ${orders[index].volume}, ${orders[index].volume}`)
      }
    }
  }
  index += 1
  console.log(`check order after, Sell : ${Account.makerSellBalance}, Buy : ${Account.makerBuyBalance}`)
  updateOrder(tradingPair, orders, bestAsk, BestBid, Account, index)
}

module.exports = updateOrder
