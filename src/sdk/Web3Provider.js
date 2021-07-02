import Web3 from "web3"
import web3Util from './Web3Util.js'
import { CHAIN_RPC, ContractsAddr, ChainSymbol, Tokens } from "./config/ChainConfig.js";

class Web3ProviderInstance {
    constructor(chainId, account) {
        this.ZERO_ADDR = '0x0000000000000000000000000000000000000000';
        this.web3 = new Web3(CHAIN_RPC[chainId]);
        this.chainId = chainId;
        this.tokens = [];
        this.account = account;
        this.apiModules = [];
    }

    registerModule(module) {
        this.apiModules.push(module);
    }

    initModules() {
        for (let module of this.apiModules) {
            module.initialize();
        }
        for (let module of this.apiModules) {
            module.initAfter();
        }
    }

    getContract(abi, address) {
        if (!abi || !address) {
            throw ('Illegal getContract address:', address);
        }
        return new this.web3.eth.Contract(abi, address)
    }

    getContractMethods(abi, address) {
        return new this.web3.eth.Contract(abi, address).methods
    }

    getContractAddr(name) {
        return ContractsAddr[this.chainId][name]
    }

    getTokenAddress(name) {
        return Tokens[this.chainId][name]
    }

    isZeroAddress(addr) {
        return addr == this.ZERO_ADDR;
    }

    getZeroSymbol() {
        return ChainSymbol.ZeroToken[this.chainId];
    }

    async getGasPrice() {
        return await this.web3.eth.getGasPrice();
    }

    async getBlockNumber() {
        let res = await this.web3.eth.getBlockNumber();
        return Number(res);
    }

    getBlockSpanTime() {
        if(this.chainId == 1) {
            return 13.5;
        }
        return 3;
    }

    getBlockToTimes(start, end) {
        let now = new Date().getTime();
        let spanTime = (Number(end) - Number(start))* this.getBlockSpanTime();
        return now+parseInt(spanTime *1000);
    }

    async getNowToEndBlockTime(block) {
        let currentBlock = await this.getBlockNumber();
        return this.getBlockToTimes(currentBlock, block);
    }

    getBlockNumbers(blockNumber, blockTime, targetTime) {
        let diff = (targetTime - blockTime)/1000/this.getBlockSpanTime();
        return Number(blockNumber) + parseInt(diff);
    }

    getBlockNumberCount(blockTime, targetTime) {
        return parseInt((targetTime - blockTime)/1000/this.getBlockSpanTime());
    }


}

var _Web3Provider = {}
export default function Web3Provider(chainId, account) {
    chainId = Number(chainId);
    if (!_Web3Provider.hasOwnProperty(chainId)) {
        _Web3Provider[chainId] = new Web3ProviderInstance(chainId, account);
    }
    return _Web3Provider[chainId];
}
