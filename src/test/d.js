// import Web3 from "web3"
// import Web3 from "./web3.min.js"
// const Web3 = require('./web3.min.js')
class Web3Util {
    constructor() {
        this.a = 999;
        this.b = 1
    }
    total(){
        console.log('Web3Util----->',this.a, this.b);
        return this.a + this.b
    }
    del(){
        return this.a - this.b
    }
    jump(a, b){
        return a+b
    }
    numberToHex(val){
        // console.log('numberToHex----->',val, Web3.utils.numberToHex('234'));
        // return Web3.utils.numberToHex(val)
    }
}

var web3Util = new Web3Util();
export default web3Util;
