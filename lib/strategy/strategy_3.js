const Decimal = require('decimal.js')
const customOrder = require('../myfunction/placeOrder.js')

// single order 2mil

async function strategyThree (askVolStructure, bidVolStructure, Account, spread) {
  console.log('ST3')

  spread = new Decimal(parseFloat(spread))
  // big spread

  // odd spread
  if (spread % 2 !== 0) {
    spread = new Decimal(spread.minus(0.001)).dividedBy(2)
    // place layer 1 sell order  unit : twd
    customOrder((askVolStructure.tradingPair), new Decimal(200), 'sell', askVolStructure.price - spread, 'limit', askVolStructure, Account)
    setTimeout(() => { // place layer 1 buy order
      customOrder(bidVolStructure.tradingPair, new Decimal(200), 'buy', bidVolStructure.price + spread, 'limit', bidVolStructure, Account)
    }, 1)

    // setTimeout(() => { // place layer 2 sell order
    //   customOrder((askVolStructure.tradingPair), new Decimal(50), 'sell', askVolStructure.price - spread + 0.001, 'limit', askVolStructure, Account)
    // }, 1)

    // setTimeout(() => { // place layer 2 buy order
    //   customOrder(bidVolStructure.tradingPair, new Decimal(50), 'buy', bidVolStructure.price + spread - 0.001, 'limit', bidVolStructure, Account)
    // }, 1)
  } else {
    // even spread
    spread = new Decimal(spread.dividedBy(2))
    // find trending

    const trend = Account.askBalance.dividedBy(Account.bidBalance)
    if (trend >= 0.67 && trend <= 1.5) {
      // no distinct trend
      if (Account.askBalance > Account.bidBalance) {
        // sell is main order
        customOrder((askVolStructure.tradingPair), new Decimal(200), 'sell', askVolStructure.price - spread, 'limit', askVolStructure, Account)
        setTimeout(() => { customOrder((bidVolStructure.tradingPair), new Decimal(200), 'buy', bidVolStructure.price + spread - 0.001, 'limit', bidVolStructure, Account) }, 1)

        // setTimeout(()=>{// layer 2 order
        //     customOrder(askVolStructure.currency, (askVolStructure.tradingPair), new Decimal(125), 'sell', askVolStructure.price - spread + 0.001, 'limit', askVolStructure, askBalance)}, 3);
        // setTimeout(()=>{
        //     customOrder(bidVolStructure.currency, (bidVolStructure.tradingPair), new Decimal(100), 'buy', bidVolStructure.price + spread - 0.002, 'limit', bidVolStructure, bidBalance)}, 3);
      } else {
        // buy is main order
        customOrder((bidVolStructure.tradingPair), new Decimal('200'), 'buy', bidVolStructure.price + spread, 'limit', bidVolStructure, Account)

        setTimeout(() => {
          customOrder((askVolStructure.tradingPair), new Decimal('200'), 'sell', askVolStructure.price - spread + 0.001, 'limit', askVolStructure, Account)
        }, 1)

        // setTimeout(()=>{ // layer 2 order
        //     customOrder(bidVolStructure.currency, (bidVolStructure.tradingPair), new Decimal(125), 'buy', bidVolStructure.price + spread - 0.001, 'limit', bidVolStructure, bidBalance)},
        // 3);

        // setTimeout(()=>{
        //     customOrder(askVolStructure.currency, (askVolStructure.tradingPair), new Decimal(100), 'sell', askVolStructure.price - spread + 0.002, 'limit', askVolStructure, askBalance)
        // }, 3);
        //
      }
    } else if (trend > 1.5) {
      // sell trend =>  place buy order as main
      customOrder((bidVolStructure.tradingPair), new Decimal('200'), 'buy', bidVolStructure.price + spread, 'limit', bidVolStructure, Account)

      // layer 2 order
      setTimeout(() => {
        customOrder((askVolStructure.tradingPair), new Decimal('200'), 'sell', askVolStructure.price - spread + 0.001, 'limit', askVolStructure, Account)
      }, 1)

    //   setTimeout(()=>{customOrder(bidVolStructure.currency, (bidVolStructure.tradingPair), new Decimal(125), 'buy', bidVolStructure.price + spread - 0.001, 'limit', bidVolStructure, bidBalance)
    // }, 3);

    //   setTimeout(()=>{customOrder(askVolStructure.currency, (askVolStructure.tradingPair), new Decimal(100), 'sell', askVolStructure.price - spread + 0.002, 'limit', askVolStructure, askBalance)
    // }, 3);
    } else {
      // buy trend => place sell as main
      customOrder((askVolStructure.tradingPair), new Decimal('200'), 'sell', askVolStructure.price - spread, 'limit', askVolStructure, Account)

      // layer 2 order
      setTimeout(() => {
        customOrder((bidVolStructure.tradingPair), new Decimal('200'), 'buy', bidVolStructure.price + spread - 0.001, 'limit', bidVolStructure, Account)
      }, 1)

    //   setTimeout(()=>{customOrder(askVolStructure.currency, (askVolStructure.tradingPair), new Decimal(125), 'sell', askVolStructure.price - spread + 0.001, 'limit', askVolStructure, askBalance)
    // }, 3);

    //   setTimeout(()=>{customOrder(bidVolStructure.currency, (bidVolStructure.tradingPair), new Decimal(100), 'buy', bidVolStructure.price + spread - 0.002, 'limit', bidVolStructure, bidBalance)
    // }, 3);
    }
  }
}
module.exports = strategyThree
