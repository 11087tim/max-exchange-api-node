const RestV2 = require('../transports/rest_v2.js')

function checkBalance (currency, bal) {
  // check currency balance
  const checkBalance = new RestV2()
  // let currencyBalance = 0

  return checkBalance.account(currency)
    .then((response) => {
      console.log(response)
      bal.value = parseFloat(response.balance)
    })
    .catch((error) => {
      console.error(error.message)
    })
}
module.exports = checkBalance
