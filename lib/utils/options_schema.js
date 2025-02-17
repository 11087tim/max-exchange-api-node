const CONSTANT = require('../constants')

const periods = CONSTANT.PERIODS // [1, 5, 15, 30, 60, 120, 240, 360, 720, 1440, 4320, 10080]
const sides = Object.values(CONSTANT.SIDES)
const sortingDirections = Object.values(CONSTANT.SORTING_DIRECTIONS)
const ordTypes = Object.values(CONSTANT.ORD_TYPES)
const depositStates = Object.values(CONSTANT.DEPOSIT_STATES)
const withdrawalStates = Object.values(CONSTANT.WITHDRAWAL_STATES)
const orderStates = Object.values(CONSTANT.ORDER_STATES)

const decimalStringMessage = 'should be a string of number'

function decimalStringValidator (val) {
  const number = parseFloat(val)
  return !isNaN(number)
}

function periodValidator (val) {
  return periods.includes(val)
}

const requiredString = { type: String, required: true }
const optionalString = { type: String }
const optionalNumber = { type: Number }
const sortingOption = { type: String, enum: sortingDirections }
const periodOption = { type: Number, use: { periodValidator }, message: `period should be a valid number in one of the options: ${periods}.` }
const sideOption = { type: String, enum: sides, required: true }
const optionalSideOption = { type: String, enum: sides }
const volumeOption = { type: String, required: true, use: { decimalStringValidator }, message: `volume ${decimalStringMessage}.` }
const priceOption = { type: String, use: { decimalStringValidator }, message: `price ${decimalStringMessage}.` }
const ordTypeOption = { type: String, enum: ordTypes }
const orderOption = { side: sideOption, volume: volumeOption, price: priceOption, stopPrice: priceOption, ordType: ordTypeOption, clientOid: optionalString }
const depositStateOption = { type: String, enum: depositStates }
const withdrawalStateOption = { type: String, enum: withdrawalStates }
const orderStateOption = {
  type: Array,
  each: { type: String, enum: orderStates },
  message: 'Please use array format(e.g. [\'wait\']) even there is only one state'
}

const optionsSchema = {
  orderBook: {
    market: requiredString,
    asksLimit: optionalNumber,
    bidsLimit: optionalNumber
  },
  depth: {
    market: requiredString,
    limit: optionalNumber
  },
  marketTrades: {
    market: requiredString,
    limit: optionalNumber,
    timestamp: optionalNumber,
    from: optionalNumber,
    to: optionalNumber,
    orderBy: sortingOption
  },
  k: {
    market: requiredString,
    limit: optionalNumber,
    period: periodOption,
    timestamp: optionalNumber
  },
  deposits: {
    currency: optionalString,
    state: depositStateOption,
    limit: optionalNumber,
    offset: optionalNumber,
    from: optionalNumber,
    to: optionalNumber
  },
  deposit: {
    txid: requiredString
  },
  depositAddresses: {
    currency: optionalString
  },
  generateDepositAddresses: {
    currency: requiredString
  },
  withdrawals: {
    currency: optionalString,
    state: withdrawalStateOption,
    limit: optionalNumber,
    offset: optionalNumber,
    from: optionalNumber,
    to: optionalNumber
  },
  withdrawal: {
    uuid: requiredString
  },
  orders: {
    market: requiredString,
    state: orderStateOption,
    groupId: optionalNumber,
    limit: optionalNumber,
    page: optionalNumber,
    orderBy: sortingOption
  },

  order: {
    id: optionalNumber,
    clientOid: optionalString
  },
  trades: {
    market: requiredString,
    limit: optionalNumber,
    timestamp: optionalNumber,
    from: optionalNumber,
    to: optionalNumber,
    orderBy: sortingOption
  },
  orderTrades: {
    id: optionalNumber,
    clientOid: optionalString
  },
  placeOrder: {
    market: requiredString,
    side: sideOption,
    volume: volumeOption,
    price: priceOption,
    stopPrice: priceOption,
    ordType: ordTypeOption,
    groupId: optionalNumber,
    clientOid: optionalString
  },
  placeOrders: {
    market: requiredString,
    groupId: optionalNumber,
    orders: [orderOption]
  },
  cancelOrders: {
    market: optionalString,
    side: optionalSideOption,
    groupId: optionalNumber
  },
  cancelOrder: {
    id: optionalNumber,
    clientOid: optionalString
  }
}

module.exports = optionsSchema
