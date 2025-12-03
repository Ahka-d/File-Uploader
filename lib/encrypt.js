const encrypt = require('bcryptjs')

function validPassword(password,uPassword) {
   return encrypt.compare(password, uPassword)
}
function genPassword(password) {
   return encrypt.hash(password, 10);
}

module.exports.validPassword = validPassword
module.exports.genPassword = genPassword