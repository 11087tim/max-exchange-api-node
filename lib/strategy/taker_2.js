const Decimal = require('decimal.js')
const RestV2 = require('../transports/rest_v2.js')
const api = new RestV2()

function takerTwo (Account) {
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
      // have open orders
      console.log(response)
      const bids = [] // store in reverse time order
      const asks = [] // store in reverse time order
      let bidsAmount = new Decimal(0.0)
      let asksAmount = new Decimal(0.0)
      for (let i = response.length - 1; i >= 0; i--) {
        if (response[i].side === 'buy') {
          bidsAmount = new Decimal(bidsAmount.plus(parseFloat(response[i].volume)).toString())
          const currentOrder = {
            id: response[i].id,
            volume: new Decimal(response[i].volume)
          }
          bids.push(currentOrder)
        } else {
          // ask orders
          asksAmount = new Decimal(asksAmount.plus(parseFloat(response[i].volume)).toString())
          const currentOrder = {
            id: response[i].id,
            volume: new Decimal(response[i].volume)
          }
          asks.push(currentOrder)
        }
        const status = Account.makerSellBalance.plus(asksAmount).dividedBy(Account.makerBuyBalance.plus(bidsAmount))
        const target = Math.abs(Account.makerSellBalance.plus(asksAmount).minus(Account.makerBuyBalance.plus(bidsAmount)).dividedBy(2))
        let tmp = new Decimal(0.0)
        let index = 0
        console.log(`status : ${status}`)
        if (status >= 4) {
          // minus sell balance
          cancel(tmp, target, asks, Account, index)
        } else if (status <= 0.25) {
          // minus buy balance
          cancel(tmp, target, bids, Account, index)
        } else {
          return
        }
      }
    })
    .catch((error) => {
      console.error(error.message)
    })
}
function cancel (tmp, target, orders, Account, index) {
  let cancelParam = {
    id: orders[index].id
  }
  // cancel
  api.cancelOrder(cancelParam)
    .then((response) => {
      console.log(`cancel order api ${response.id}`)
      tmp = new Decimal(tmp.plus(orders[index].volume))
      if (response.side === 'buy') {
        Account.makerBuyBalance = new Decimal(Account.makerBuyBalance).plus(response.volume)
      } else {
        // sell
        Account.makerAskBalance = new Decimal(Account.makerAskBalance).plus(response.volume)
      }
      if (tmp >= target) {
        index += 1
        setTimeout(() => {
          cancel(tmp, target, orders, Account, index)
        }, 1)
      }
    })
}

// function rebalance () {
//   let twdBal = {
//     value: 0
//   }
//   let usdtBal = {
//     value: 0
//   }
//   checkBalance('twd', twdBal)
//     .then(() => {
//       checkBalance('usdt', usdtBal)
//         .then(() => {
//           let params = {
//             market: 'usdttwd',
//             side: '',
//             volume: 0,
//             ordType: 'market'
//           }
//           twdBal.value = twdBal.value / 31.5
//           if (usdtBal.value > twdBal.value) {
//             params.volume = ((usdtBal.value - twdBal.value) / 2).toString()
//             params.side = 'sell'
//           } else {
//             params.volume = ((twdBal.value - usdtBal.value) / 2).toString()
//             params.side = 'buy'
//           }

//           const order = new RestV2()
//           try {
//             order.placeOrder(params)
//               .then((response) => {
//                 // Access the response here
//                 console.log('balance rebalance', response)
//                 rebalance = True
//                 this._ws.connect()
//               })
//               .catch((error) => {
//                 console.error(error.message)
//                 this._ws.connect()
//               })
//           } catch (customError) {
//             console.error(customError.message)
//           }
//         })
//     })
// }

module.exports = takerTwo

takerTwo()
