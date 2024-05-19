const RestV2 = require('../transports/rest_v2.js')
const Decimal = require('decimal.js')
const api = new RestV2()

function iteratation (openOrdersArray) {
  let openBuyValue = new Decimal('0.0')
  let openSellValue = new Decimal('0.0')
  for (let i = 0; i < openOrdersArray.length; ++i) {
    if (openOrdersArray[i].side === 'buy') {
      openBuyValue = new Decimal(parseFloat(openOrdersArray[i].remaining_volume)).plus(openBuyValue)
    } else {
      // sell order
      openSellValue = new Decimal(parseFloat(openOrdersArray[i].remaining_volume)).plus(openSellValue)
    }
  }
  // console.log("test",openBuyValue, openSellValue)
  return [openBuyValue, openSellValue]
}

function StopOrder (Account) {
  let openBuyValue = 0
  let openSellValue = 0
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
        } else {
          [openBuyValue, openSellValue] = iteratation(response)
        }
        let totalBuyValue = new Decimal(new Decimal(openBuyValue).plus(Account.makerBuyBalance))
        let totalSellValue = new Decimal(new Decimal(openSellValue).plus(Account.makerSellBalance))
        console.log('trend:', totalBuyValue, totalSellValue)

        const trend = totalBuyValue.dividedBy(totalSellValue)
        if (trend >= 4 || isNaN(trend)) {
          console.log('too many buy')
          Account.sellOrderVaild = false
          Account.buyOrderVaild = true

          let params = {
            market: 'usdttwd',
            side: 'sell'
          }
          api.cancelOrders(params)
            .then((response) => {

            })
        } else if (trend <= 0.25) {
          console.log('too many sell')
          Account.buyOrderVaild = false
          Account.sellOrderVaild = true
          let params = {
            market: 'usdttwd',
            side: 'buy'
          }
          api.cancelOrders(params)
            .then((response) => {

            })
        } else {
          // trend in range
          if (Account.buyOrderVaild === false) {
            if (trend >= 0.67) { Account.buyOrderVaild = true }
          }
          if (Account.sellOrderVaild === false) {
            if (trend <= 1.5) { Account.sellOrderVaild = true }
          }
        }
      })
      .catch((error) => {
        console.error(error.message)
      })
  } catch (error) {
    console.log(error)
  }
}

module.exports = StopOrder
