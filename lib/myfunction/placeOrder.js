const RestV2 = require('../transports/rest_v2.js')
const Decimal = require('decimal.js')

/**
 *
 * @param {string} targetCurrency // market
 * @param {string} tradingPair  // market
 * @param {float or integer} baseVol    // 2 mil in our case in (usdt)
 * @param {string} side
 * @param {float} price
 * @param {object} volStructure
 * @returns [object]
 */

function customOrder (tradingPair, baseVol, side, price, type, volStructure, Account) {
  if (side === 'buy' && !Account.buyOrderVaild) {
    console.log('No vaild Buy')
    return
  } else if (side === 'sell' && !Account.sellOrderVaild) {
    console.log('No vaild sell')
    return
  }
  let Params = {
    market: tradingPair,
    side: side,
    volume: 0,
    price: price.toString(),
    ordType: type
  }

  // check taget currency balance

  const api = new RestV2()

  console.log(type, side, baseVol, Account.makerSellBalance, Account.makerBuyBalance)
  if (side === 'buy' && type === 'limit') {
    // decide trade vol
    if (Math.floor(Account.makerBuyBalance) - baseVol >= 0) {
      Params.volume = Math.floor((baseVol)).toString()
    } else if (baseVol - Math.floor(Account.makerBuyBalance) > 0 && Account.makerBuyBalance - 16 > 0) {
      Params.volume = Math.floor((Account.makerBuyBalance)).toString()
    } else {
      console.log(`fail buy limit order Bal :${Account.makerBuyBalance}, ${baseVol}`)
      return
    }
  } else if (side === 'sell' && type === 'limit') {
    // decide trade vol
    if (Math.floor(Account.makerSellBalance) - baseVol >= 0) {
      Params.volume = Math.floor((baseVol)).toString()
    } else if (baseVol - Math.floor(Account.makerSellBalance) > 0 && Account.makerSellBalance - 16 > 0) {
      Params.volume = Math.floor((Account.makerSellBalance)).toString()
    } else {
      console.log(`fail sell limit order Bal :${Account.makerSellBalance}, ${baseVol}`)
      return
    }
  } else if (side === 'buy' && type === 'market') {
    // taker
    if (Math.floor(Account.takerBuyBalance) - baseVol > 0) {
      Params.volume = Math.floor((baseVol)).toString()
      delete Params.price
    } else if (baseVol - Math.floor(Account.takerBuyBalance) > 0 && Account.takerBuyBalance - 16 > 0) {
      Params.volume = Math.floor((Account.takerBuyBalance)).toString()
      delete Params.price
    } else {
      console.log(`fail buy market order Bal :${Account.takerBuyBalance}, ${baseVol}`)
      return
    }
  } else {
    // taker sell
    if (Math.floor(Account.takerSellBalance) - baseVol >= 0) {
      Params.volume = Math.floor((baseVol)).toString()
      delete Params.price
    } else if (baseVol - Math.floor(Account.takerSellBalance) > 0 && Account.takerSellBalance - 16 > 0) {
      Params.volume = Math.floor((Account.takerSellBalance)).toString()
      delete Params.price
    } else {
      console.log(`fail sell market order Bal :${Account.takerSellBalance}, ${baseVol}`)
      return
    }
  }
  console.log(`decided vol : ${Params.volume}`)
  api.placeOrder(Params)
    .then((response) => {
      if (parseFloat(response.p) !== volStructure.price) {
        console.log(`order result:${response.id} | ${response.price} | ${response.volume} `)
        volStructure.price = new Decimal(response.price)
        volStructure.ourVol = new Decimal(response.volume)
      } else {
        if (type === 'limit') {
        // maker
          volStructure.ourVol = new Decimal(volStructure.ourVol).plus(response.volume)
        }
      }
    })
    .catch((error) => {
      console.log('error!:', error)
    })
}

// function export
module.exports = customOrder
