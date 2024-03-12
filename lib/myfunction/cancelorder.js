const RestV2 = require('../transports/rest_v2.js')
const Decimal = require('decimal.js')
const api = new RestV2()

function iteratation (Array, index, bestAsk, bestBid, spread, Account) {
  let cancel_ = false
  if (index === Array.length) {
    // end
    console.log('end', index)
    return
  }

  if ((Array[index]).side === 'buy') {
    let currentbid = new Decimal(parseFloat(Array[index].price))
    console.log('buy side check ', currentbid.minus(bestBid))
    if (currentbid.minus(bestBid) <= -0.001) {
      // not the best bid
      cancel_ = true
    } else {
      //  currentBid is bestBidx but Bid-Ask Spread occur
      if (spread > 0.001) {
        cancel_ = true
      }
    }
    if (cancel_) {
      let cancelParam = {
        id: Array[index].id
      }

      api.cancelOrder(cancelParam)
        .then((response) => {
          console.log(`cancel order api ${response.id}`)
          Account.makerBuyBalance = Math.round(new Decimal(Account.makerBuyBalance).plus(response.volume))
        })
    }
  } else {
    // side sell
    let currentask = new Decimal(Array[index].price)
    console.log('sell side check', currentask.minus(bestAsk))
    if (currentask.minus(bestAsk) >= 0.001) {
      // not the best ask
      cancel_ = true
    } else {
      //  currentBid is bestBidx but Bid-Ask Spread occur
      if (spread > 0.001) {
        cancel_ = true
      }
    }
    if (cancel_) {
      let cancelParam = {
        id: Array[index].id
      }

      api.cancelOrder(cancelParam)
        .then((response) => {
          console.log(`cancel order api ${response.id}`)
          Math.round(Account.makerBuyBalance = new Decimal(Account.makerBuyBalance).plus(response.volume))
        })
    }
  }
  index += 1
  setTimeout(() => {
    iteratation(Array, index, bestAsk, bestBid, spread, Account)
  }, 1)
}

// fetch open order here !
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

        let spread_ = new Decimal(new Decimal(bestAsk).minus(bestBid)) // bid-ask spread
        console.log('spread in cancelOrder : ', spread_)
        // console.log(`start to cancel : ${response.length}`, response)
        iteratation(response, 0, bestAsk, bestBid, spread_, Account)
      })
      .catch((error) => {
        console.error(error.message)
      })
  } catch (error) {
    console.log(error)
  }
}
module.exports = cancelOrder
