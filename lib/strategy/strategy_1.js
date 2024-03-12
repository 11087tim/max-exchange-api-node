// worker.js
const Decimal = require('decimal.js')
const customOrder = require('../myfunction/placeOrder')

function straegyOne (askVolStructure, bidVolStructure, Account, spread = 0.001) {
  const trend = askVolStructure.ourVol.dividedBy(bidVolStructure.ourVol)

  if (trend > 0.67) {
    // buy trend = > place sell order more
    // console.log(`st1 trend1-1 : ${Date.now()}`)
    customOrder((askVolStructure.tradingPair), new Decimal(7874), 'sell', askVolStructure.price, 'limit', askVolStructure, Account)
    setTimeout(() => { customOrder((bidVolStructure.tradingPair), new Decimal(3937), 'buy', bidVolStructure.price, 'limit', bidVolStructure, Account) }, 1)
    // setTimeout(()=>{console.log(`st1 trend 1-2 ${Date.now()} `)}, 3);
  } else if (trend > 1.5) {
    // sell trend = > place buy order more
    // console.log(`st1 trend2-1 : ${Date.now()}`)
    customOrder((askVolStructure.tradingPair), new Decimal(7874), 'buy', bidVolStructure.price, 'limit', bidVolStructure, Account)
    setTimeout(() => {
      customOrder((bidVolStructure.tradingPair), new Decimal(3937), 'sell', askVolStructure.price, 'limit', askVolStructure, Account)
    }, 1)
    // setTimeout(()=>{console.log(`st1 trend 1-2 ${Date.now()} `)}, 3);
  } else {
    // no distinct trend
    customOrder((askVolStructure.tradingPair), new Decimal(7874), 'sell', askVolStructure.price, 'limit', askVolStructure, Account)
    setTimeout(() => {
      customOrder((bidVolStructure.tradingPair), new Decimal(3937), 'buy', bidVolStructure.price, 'limit', bidVolStructure, Account)
    }, 1)
    // console.log(`st1 trend3-1 : ${Date.now()}`)
    // setTimeout(()=>{console.log(`st1 trend 3-2 ${Date.now()} `)}, 3);
  }
}

module.exports = straegyOne
