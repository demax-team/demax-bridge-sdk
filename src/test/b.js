import jump from './c'
import {sum, count, del} from './a'
import web3Util from './d'
// import engine from 'unified-engine'
import BigNumber from "bignumber.js";

// console.log('hello', BigNumber)

// console.log('hello', new BigNumber(1).gt(2))

var Testl = {
    name: 'April',
    key: '19901',
    age: 100,
    jump,
    sum,
    count,
    del,
    Bignumber: (number) => new BigNumber(number),
    gt: new BigNumber(1).gt(2),
    web3Util,
    // ags: web3Util.total(),
    // agd: web3Util.del()
}

// console.log('Testl-----', Testl)
// console.log('web3Util-----', Testl.web3Util.numberToHex("12312312"))

export default Testl
