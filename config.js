const accesskey  = 'aKyHoMYl835uxKK8G14EZV6MxhcByVYxBY0uNRZJ'
const secretKey  =  'XhRZXwvPzGlDzPp1ScInWbfZhxihQzyGJTd4Li82' 
const userID = 'f0c10e18-392c-434d-ac38-cf2939fcbf49'
const crypto = require("crypto");
const hmac = crypto.createHmac("sha256", secretKey);
const nonce = Date.now();
const signature = hmac.update(""+nonce).digest("hex");

//console.log(nonce, signature)

module.exports = { accesskey, secretKey, userID, nonce, signature}
