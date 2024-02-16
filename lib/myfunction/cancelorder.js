const RestV2 = require('../transports/rest_v2.js')
const Decimal = require('decimal.js')
const api = new RestV2()

function iteratation (Array, index, bestAsk, bestBid, Account) {
  if (index === Array.length) {
    // end
    console.log('end', index)
    return
  }
  // console.log('cancelorder :',Array, index, bestAsk, bestBid)

  if ((Array[index]).side === 'buy') {
    let currentbid = new Decimal(parseFloat(Array[index].price))
    console.log('buy side check ', currentbid.minus(bestBid))
    if (currentbid.minus(bestBid) <= -0.001) {
      let cancelParam = {
        id: Array[index].id
      }

      api.cancelOrder(cancelParam)
        .then((response) => {
          console.log(`cancel order api ${response.id}`)
          Account.makerBuyBalance = new Decimal(Account.makerBuyBalance).plus(response.volume)
        })
    }
  } else {
    // side sell
    let currentask = new Decimal(Array[index].price)
    console.log('sell side check', currentask.minus(bestAsk))
    if (currentask.minus(bestAsk) >= 0.001) {
      let cancelParam = {
        id: Array[index].id
      }

      api.cancelOrder(cancelParam)
        .then((response) => {
          console.log(`cancel order by api ${response.id}`)
          Account.makerSellBalance = new Decimal(Account.makerSellBalance).plus(response.volume)
        })
    }
  }
  index += 1
  setTimeout(() => {
    iteratation(Array, index, bestAsk, bestBid, Account)
  }, 1)
}

function cancelOrder (bestAsk, bestBid, Account) {
  try {
    let param = {
      market: 'usdttwd',
      state: ['wait']
    }

    // get orders
    api.orders(param)
      .then((response) => {
        // cancel;
        if (response.length === 0) {
          console.log('no open orders now')
          return
        }
        // console.log(`start to cancel : ${response.length}`, response)
        iteratation(response, 0, bestAsk, bestBid, Account)
      })
      .catch((error) => {
        console.error(error.message)
      })
  } catch (error) {
    console.log(error)
  }
}
module.exports = cancelOrder
