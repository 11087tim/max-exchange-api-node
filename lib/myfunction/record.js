const fs = require('fs')
const Decimal = require('decimal.js')

function records (makerVol, takerVol, Account) {
  makerVol = new Decimal(makerVol)
  takerVol = new Decimal(takerVol)

  console.log(`start tp write record : ${Account.index}`)
  // Read the contents of the file
  fs.readFile('record.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }) // Adjust timezone to UTC+8
    // console.log(currentTime)
    // Split the content into lines
    const lines = data.split('\n')

    // Modify the data
    // time : , maker total : , profit(0.008%) :  | time : , taker cost  :   | net profit :
    const profit = new Decimal(makerVol.times(0.00008))
    const net = new Decimal(profit.minus(takerVol.times(0.00075)))
    lines[Account.index] = 'Time: ' + currentTime.toLocaleString() + ', maker Vol: ' + makerVol.toString() + ' , maker rebates:' + profit.toString() + ' | taker Vol: ' + takerVol.toString() + ' | net profit: ' + net.toString()

    // Join the lines back into a single string
    const modifiedContent = lines.join('\n')

    // Write the modified content back to the file
    fs.writeFile('record.txt', modifiedContent, (err) => {
      if (err) {
        console.error(err)
        return
      }
      console.log('record updated successfully.')
      Account.index += 1
    })
  })
}
module.exports = records
