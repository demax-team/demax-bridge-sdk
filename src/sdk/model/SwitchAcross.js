import SwitchAcrossABI from '../abi/SwitchAcross.json';
import BigNumber from "bignumber.js"
import BaseByName from './BaseByName';
import Base from './Base';
import { ERC20Token, newERC20Token } from './ERC20Token.js';
import Web3Provider from '../Web3Provider.js';
import web3Util from '../Web3Util.js'
import { SwitchChainIds, SwitchPools } from '../config/SwitchConfig.js';
import { newSwitchTreasury } from './SwitchTreasury.js';

function asleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getChainIds(chainId) {
    if([42,97,256].includes(chainId)) {
        return SwitchChainIds.test;
    }
    return SwitchChainIds.main;
}

var _switchAcrossTokens = {};
var _switchCount = 0;
var _switchAcrossHistory = [];
var _process = {
    step1_pending: 10,
    step1_success: 11,
    step1_fail: 12,
    step2_pending: 20,
    step2_success: 21,
    step2_fail: 22,
}

const _switchDefaultData = {
    "ukey": "chainIdIn-inSn",
    "process": _process.step1_pending,
    "status": 0,
    "inSn": 0,
    "outSn": 0,
    "mode": 0,
    "chainIdIn": 0,
    "tokenIn": "",
    "tokenInSymbol": "",
    "chainIdOut": 0,
    "tokenOut": "",
    "tokenOutSymbol": "",
    "amountIn": "0",
    "amountOut": "0",
    "fee": "0",
    "slide": "0",
    "user": "",
    "signature": "",
    "txIn": "",
    "txOut": "",
    "blockIn": 0,
    "blockOut": 0,
    "timeIn": null,
    "timeOut": null,
    "updateTime": new Date(),
};
var _switchData = {..._switchDefaultData};

function loadSwitchCount() {
    let res = localStorage.getItem('_switchCount');
    if(res) {
        _switchCount = Number(res);
        if(_switchCount <0) {
            _switchCount = 0;
        }
    }
}

function cleanSwitchCount() {
    _switchCount = 0;
    localStorage.setItem('_switchCount', _switchCount+'');
}

function updateSwitchCount(num) {
    _switchCount += num;
    if(_switchCount <0) {
        _switchCount = 0;
    }
    localStorage.setItem('_switchCount', _switchCount+'');
}

loadSwitchCount();

function isMyWallet(_user) {
    const local = localStorage.getItem('myWallets');
    if (local) {
        const wallets = JSON.parse(local);
        for(let w in wallets) {
            console.log('isMywallet:', w, _user);
            if(w.toLowerCase() == _user.toLowerCase()) {
                return true;
            }
        }
    }
    return false;
}

function isTicket(_token, chainId) {
    for (let k in _switchAcrossTokens) {
        if (_switchAcrossTokens[k].opened == true) {
            for (let i=0; i<_switchAcrossTokens[k].list.length; i++) {
                if(_switchAcrossTokens[k].list[i].tokenAddress.toLowerCase() == _token.toLowerCase() && _switchAcrossTokens[k].list[i].chainId == chainId) {
                    return _switchAcrossTokens[k].list[i].isTicket;
                }
            }
        }
    }
    return false;
}

function updateChainBlock(chainId) {
    let provider = Web3Provider(chainId);
    provider.getBlockNumber().then(res=> {
        localStorage.setItem('_switchBlockNumber'+chainId, res+'');
    })
}

function getChainBlock(chainId) {
    if(_switchCount > 0) {
        let res = localStorage.getItem('_switchBlockNumber'+chainId);
        return Number(res);
    }
    return 0;
}

class SwitchAcross extends BaseByName {
    constructor(provider) {
        super(provider, SwitchAcrossABI, 'SwitchAcross');

        this.gasDecimals = 18;
        this.targetTokens = {};
        this.subscribes = [];
        this.subscriptions = [];
        this.currentBlock = 0;
        this.process = _process;
    }

    initialize(chainId, account=null) {
        console.log('SwitchAcross initialize...', this.provider.chainId);
        super.initialize(chainId, account);
    }

    initAfter() {
        console.log('SwitchAcross initAfter...', this.provider.chainId, this.subscribes.length);
        this.initSubscribe();
    }

    initSubscribe() {
        let subscription = this.provider.web3.eth.subscribe('logs', {
            fromBlock: 'latest',
            address: this.address
        }, (error, result) => {
            if (!error) {
                let eventLog = this.findEventOneLog(result);
                eventLog.chainId = this.provider.chainId;
                console.log('subscribes length:', this.provider.chainId, this.subscribes.length);
                this.subscribes.forEach((cb)=>{
                    console.log('SwitchAcross subscribe subscribe', this.provider.chainId, eventLog);
                    if(this.address.toLowerCase() == eventLog.address.toLowerCase()) {
                        cb(eventLog);
                    } else {
                        console.warn('SwitchAcross subscribe unknown address', this.provider.chainId, eventLog.address);
                    }
                });
            } else {
                console.error('SwitchAcross subscribe error:', this.provider.chainId, error);
            }
        });
        this.subscriptions.push(subscription);
    }

    async scanEventLog() {
        if(this.currentBlock == 0) {
            this.currentBlock = getChainBlock(this.provider.chainId);
            if(this.currentBlock == 0) this.currentBlock = await this.provider.getBlockNumber();
        }
        if(_switchCount <=0) {
            // console.log('SwitchAcross scanEventLog sikp');
            await asleep(3000);
            this.scanEventLog();
            return;
        }
        let latestBlockNumber = this.currentBlock;
        try {
            latestBlockNumber = await this.provider.getBlockNumber();
        } catch(e) {
            console.error('SwitchAcross scan except:', e);
            await asleep(3000);
            this.scanEventLog();
            return;
        }
        let toBlock = Math.min(this.currentBlock+1000, latestBlockNumber);
        // console.log('SwitchAcross scanEventLog...', this.provider.chainId, this.currentBlock, toBlock);
        if(toBlock > this.currentBlock) {
            let records = null;
            try {
                console.log('SwitchAcross getPastEvents...', this.provider.chainId, this.currentBlock, toBlock);
                records = await this.contract.getPastEvents("TransferOuted", {fromBlock: this.currentBlock, toBlock: toBlock});
                // console.log('SwitchAcross getPastEvents records:', this.provider.chainId, records);
                Object.keys(records).forEach(async (i)=>{
                    let eventLog = {...records[i]};
                    eventLog.chainId = this.provider.chainId;
                    eventLog.eventName = "TransferOuted";
                    console.log('getPastEvents eventLog:', this.subscribes.length, eventLog);
                    this.subscribes.forEach((cb)=>{
                        cb(eventLog);
                    });
                    this.currentBlock = Number(eventLog.blockNumber);
                })
                this.currentBlock = toBlock;
            } catch(e) {
                console.error('SwitchAcross scan getTransferOutedEvents:', this.provider.chainId, typeof(records), Array.isArray(records), records, e);
            }
        }
        await asleep(3000);
        this.scanEventLog();
    }

    findEventOneLog(logs) {
        return web3Util.parseEventOneLog(this.provider.web3, SwitchAcrossABI, logs, 'TransferIned');
    }

    subscribe(cb) {
        if(!this.subscribes.includes(cb)) {
            console.log('SwitchAcrossInstance initSubscribe subscribe chainId:', this.provider.chainId);
            this.subscribes.push(cb);
        }
    }

    unsubscribe() {
        this.subscriptions.forEach((subscription)=>{
            subscription.unsubscribe(function(error, success){
                if(success)
                    console.log('Successfully unsubscribed!');
            });
        })
    }

    clean() {
        console.log('clean...');
        this.unsubscribe();
    }

    async getTokenInfo(token) {
        this.tokenIns = new ERC20Token(this.provider, token);
        return await this.tokenIns.info();
    }

    async getTokenOutInfo(tokenIn, toChainId) {
        let key = tokenIn.toLowerCase()+'_'+toChainId;
        let res = null;
        if(!this.targetTokens.hasOwnProperty(key)) {
            res = await this.contract.methods.targetTokens(tokenIn, toChainId).call();
            if(!this.provider.isZeroAddress(res.tokenOut)) {
                this.targetTokens[key] = res;
            }
        } else {
            res = this.targetTokens[key];
        }
        return res;
    }

    async getSourceToken(tokenIn) {
        let res = await this.contract.methods.sourceTokens(tokenIn).call();
        let source = {...res};
        source.tokenIn = tokenIn;
        source.symbol = (await this.getTokenInfo(tokenIn)).symbol;
        return source;
    }

    async iterateTokens(start, end) {
        let count = await this.contract.methods.countToken().call();
        count = Number(count);
        if(end > count) {
            end = count;
        }
        let data = [];
        for(let i = start; i < end; i++) {
            let token = await this.contract.methods.tokens(i).call();
            let d = await this.getSourceToken(token);
            d.targets = await this.getTargetTokensForSource(token);
            data.push(d);
        }
        return data;
    }

    async getTargetToken(tokenIn, chainId) {
        let key = tokenIn.toLowerCase()+'_'+chainId;
        let res = await this.contract.methods.targetTokens(tokenIn, chainId).call();
        let target = {...res};
        target.symbol = '';
        if(!this.provider.isZeroAddress(target.tokenOut)) {
            let tokenIns = newERC20Token(chainId, target.tokenOut);
            let tokenInfo = await tokenIns.info();
            target.chainId = chainId;
            target.symbol = tokenInfo.symbol;
        }
        this.targetTokens[key] = target;
        return target;
    }

    async getTargetTokensForSource(tokenIn) {
        let chainIds = getChainIds(this.provider.chainId);
        let data = [];
        for(let chainId of chainIds) {
            if(chainId == this.provider.chainId) continue;
            let d = await this.getTargetToken(tokenIn, chainId);
            data.push(d);
        }
        return data;
    }

    async getInOrders(sn) {
        return await this.contract.methods.getInOrders(sn).call();
    }

    async getOutOrders(sn) {
        return await this.contract.methods.getOutOrders(sn).call();
    }

    async queryWithdraw(token, value) {
        return await this.contract.methods.queryWithdraw(token, value).call();
    }

    async totalSlideOfToken(token) {
        return await this.contract.methods.totalSlideOfToken(token).call();
    }

    async getOutInfo(tokenIn, toChainId, amountIn, mode) {
        if (!mode) {
            mode = 2
        }
        console.log('getOutInfo:', tokenIn, toChainId, amountIn, mode);
        let tokenInInfo = await this.getTokenInfo(tokenIn)
        let amountInStr = new BigNumber(amountIn).shiftedBy(1 * tokenInInfo.decimals).toFixed();
        let res = await this.contract.methods.getOutInfo(tokenIn, toChainId, amountInStr, mode).call();
        if(this.provider.isZeroAddress(res.tokenOut)) {
            res.amountOut = '0';
        }
        let tokenOutInfo = await this.getTokenOutInfo(tokenIn, toChainId);
        let d = {...res};
        d.amountIn = amountIn;
        d.amountOut = new BigNumber(res.amountOut).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();
        d.slide = new BigNumber(res.slide).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();
        d.fee = new BigNumber(res.fee).shiftedBy(-1 * this.gasDecimals).toFixed();
        d.inLimit = new BigNumber(res.inLimit).shiftedBy(-1 * tokenInInfo.decimals).toFixed();
        d.outLimit = new BigNumber(res.outLimit).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();

        
        if(!isTicket(tokenOutInfo.tokenOut, toChainId)) {
            let treasureBalance = await newSwitchTreasury(toChainId).queryWithdraw(this.address, tokenOutInfo.tokenOut);
            if(new BigNumber(res.outLimit).gt(new BigNumber(treasureBalance))) {
                d.outLimit = new BigNumber(treasureBalance).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();
            }
        }
        
        return d;
    }

    async getInInfo(tokenIn, toChainId, amountOut, mode) {
        if (!mode) {
            mode = 2
        }
        let tokenOutInfo = await this.getTokenOutInfo(tokenIn, toChainId);
        if(this.provider.isZeroAddress(tokenOutInfo.tokenOut)) {
            d.amountOut = '0';
        }
        let amountOutStr = new BigNumber(amountOut).shiftedBy(1 * tokenOutInfo.decimals).toFixed();
        console.log('inInfo:', tokenOutInfo, amountOutStr)
        let tokenInInfo = await this.getTokenInfo(tokenIn)
        let res = await this.contract.methods.getInInfo(tokenIn, toChainId, amountOutStr, mode).call();
        let d = {...res};
        d.amountOut = amountOut;
        d.amountIn = new BigNumber(res.amountIn).shiftedBy(-1 * tokenInInfo.decimals).toFixed();
        d.slide = new BigNumber(res.slide).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();
        d.fee = new BigNumber(res.fee).shiftedBy(-1 * this.gasDecimals).toFixed();
        d.inLimit = new BigNumber(res.inLimit).shiftedBy(-1 * tokenInInfo.decimals).toFixed();
        d.outLimit = new BigNumber(res.outLimit).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();

        if(!isTicket(tokenOutInfo.tokenOut, toChainId)) {
            let treasureBalance = await newSwitchTreasury(toChainId).queryWithdraw(this.address, tokenOutInfo.tokenOut);
            if(new BigNumber(res.outLimit).gt(new BigNumber(treasureBalance))) {
                d.outLimit = new BigNumber(treasureBalance).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();
            }
        }
        return d;
    }

    async transferIn(to, tokenIn, tokenOut, amountIn, amountOut, toChainId, fee, mode) {
        if (!mode) {
            mode = 2
        }
        let tokenInInfo = await this.getTokenInfo(tokenIn)
        let amountInInt = new BigNumber(amountIn).shiftedBy(1 * tokenInInfo.decimals)

        let tokenOutInfo = await this.contract.methods.targetTokens(tokenIn, toChainId).call();
        let amountOutInt = new BigNumber(amountOut).shiftedBy(1 * tokenOutInfo.decimals)
        let value = new BigNumber(fee).shiftedBy(1 * this.gasDecimals);
        if (tokenIn.toLocaleLowerCase() == this.provider.ZERO_ADDR) {
            value = value.plus(amountInInt)
        }
        let tokens = [tokenIn, tokenOut]
        let values = [amountInInt.toFixed(), amountOutInt.toFixed(), toChainId, mode]
        updateChainBlock(toChainId);
        return await this.provider.executeContract(this.contract, 'transferIn', value.toFixed(), [to, tokens, values], this.handleTransferIn);
    }

    async transferOut(from, token0, token1, amountIn, amountOut, fromChainId, mode, slide, inSn, signature) {
        if (!mode) {
            mode = 0
        }

        let tokens = [token0, token1]
        let values = [amountIn, amountOut, fromChainId, mode, slide, inSn]
        return await this.provider.executeContract(this.contract, 'transferOut', 0, [from, tokens, values, signature], this.handleTransferOut);
    }

    async myTransferOut(data) {
        if(data.process !=_process.step1_success) throw('myTransferOut: process must be step1_success');
        if(Number(data.chainIdOut) != this.provider.chainId) throw('myTransferOut: invalid chainId');
        let res = await this.handleTxWrap(data.chainIdIn, data.txIn);
        console.log('myTransferOut handleTxWrap: ', res);
        if(!res) throw('myTransferOut: network error');
        if(res && res.data && res.data.status ==1) throw('myTransferOut: already hanlded');
        if(res && res.data && res.data.status ==0 && !res.data.signature) throw('myTransferOut: invalid signature');
        data = res.data;
        return await this.transferOut(data.user, data.tokenIn, data.tokenOut, data.amountIn, data.amountOut, data.chainIdIn, data.mode, data.slide, data.inSn, data.signature);
    }

    async handleTransferIn(data) {
        console.log('handleTransferIn:', data);
        _switchData.process = _process.step1_pending;
        _switchData.user = data.inputValues[0].toLowerCase();
        _switchData.chainIdIn = Number(data.chainId);
        _switchData.chainIdOut = Number(data.inputValues[2][2]);
        _switchData.tokenIn = data.inputValues[1][0].toLowerCase();
        _switchData.tokenOut = data.inputValues[1][1].toLowerCase();
        _switchData.txIn = data.transactionHash;
        _switchData.mode = Number(data.inputValues[2][3]);
        _switchData.timeIn = new Date();
        _switchData.updateTime= new Date();

        let tokenInInfo = await newERC20Token(_switchData.chainIdIn, _switchData.tokenIn).info();
        let tokenOutInfo = await newERC20Token(_switchData.chainIdOut, _switchData.tokenOut).info();
        _switchData.tokenInSymbol = tokenInInfo.symbol;
        _switchData.tokenOutSymbol = tokenOutInfo.symbol;
        _switchData.amountIn = new BigNumber(data.inputValues[2][0]).shiftedBy(-1 * tokenInInfo.decimals).toFixed();
        _switchData.amountOut = new BigNumber(data.inputValues[2][1]).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();
        if(data.hasOwnProperty('status')) {
            if(data.status) {
                _switchData.process = _process.step1_success;
            } else {
                _switchData.process = _process.step1_fail;
            }
        }
    }

    async handleTransferOut(data) {
        console.log('handleTransferOut:', data);
        _switchData.process = _process.step2_pending;
        _switchData.user = data.inputValues[0].toLowerCase();
        _switchData.inSn = Number(data.inputValues[2][5]);
        _switchData.chainIdIn = data.inputValues[2][2];
        _switchData.chainIdOut = Number(data.chainId);
        _switchData.tokenIn = data.inputValues[1][0].toLowerCase();
        _switchData.tokenOut = data.inputValues[1][1].toLowerCase();
        _switchData.txOut = data.transactionHash;
        _switchData.updateTime= new Date();

        let tokenInInfo = await newERC20Token(_switchData.chainIdIn, _switchData.tokenIn).info();
        let tokenOutInfo = await newERC20Token(_switchData.chainIdOut, _switchData.tokenOut).info();
        _switchData.tokenInSymbol = tokenInInfo.symbol;
        _switchData.tokenOutSymbol = tokenOutInfo.symbol;
        _switchData.amountIn = new BigNumber(data.inputValues[2][0]).shiftedBy(-1 * tokenInInfo.decimals).toFixed();
        _switchData.amountOut = new BigNumber(data.inputValues[2][1]).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();
        
        let _status = 0;
        if(data.hasOwnProperty('status')) {
            if(data.status) {
                _switchData.timeOut = new Date();
                _switchData.process = _process.step2_success;
                _status = 1;
            } else {
                _switchData.process = _process.step2_fail;
            }
        }

        let tableName = 'switchArcossHistory' + _switchData.user;
        const local = localStorage.getItem(tableName);
        if (local) {
            let foundI = -1;
            let ukey = _switchData.chainIdIn + '-' + _switchData.inSn;
            _switchAcrossHistory.forEach((d, i) => {
                if (d.ukey == ukey) {
                    foundI = i
                    return
                }
            })
            if (foundI > -1) {
                item = {..._switchAcrossHistory[foundI]};
                item.status = _status;
                item.process= _switchData.process;
                item.outSn = _switchData.outSn;
                item.txOut = _switchData.txOut;
                item.blockOut = _switchData.blockOut;
                item.timeOut = new Date();
                item.updateTime= new Date();
                _switchAcrossHistory.splice(foundI, 1)
            }
            _switchAcrossHistory.unshift(item);
            localStorage.setItem(tableName, JSON.stringify(_switchAcrossHistory));
        }
    }

    resetSwitchData() {
        _switchData = {..._switchDefaultData}
        return _switchData;
    }

    async handleTxWrap(chainId, tx) {
        let url = '/api/handleTx';
        if([42,97,256].includes(chainId)) {
            url = '/api-test/handleTx';
        }
        return await this.handleTx(chainId, tx, url);
    }

    async handleTx(chainId, tx, url) {
        if(!url) {
            if([42,97,256].includes(chainId)) {
                url = 'https://switchfinance.xyz/api-test/handleTx';
            } else {
                url = 'https://switchfinance.xyz/api/handleTx';
            }
        }
        let param = {
            chainId: chainId,
            tx: tx,
        };
        let res = await fetch(url, {
            method: 'post',
            body: JSON.stringify(param),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })

        let text = await res.text();
        return JSON.parse(text);
    }
}

class SwitchAcrossHistory extends Base {
    constructor(provider) {
        super(provider);
        this.envName = 'main';
        this.process = _process;
    }

    getEnvName() {
        if([42,97,256].includes(this.provider.chainId)) {
            return 'test';
        }
        return 'main';
    }

    initialize(chainId, account=null) {
        console.log('SwitchAcrossHistory initialize...', this.provider.chainId);
        super.initialize(chainId, account);
        this.getAcrossTokens();
        this.loadHistory();
        let ids = getChainIds(this.provider.chainId);
        for (let i=0; i<ids.length; i++) {
            newSwitchAcross(ids[i]).subscribe(this.handleHistory);
        }
    }

    // status, 0: pending 1:success
    async handleHistory(log) {
        let d = log.returnValues;
        if(!isMyWallet(d.user)) {
            return;
        }
        let tableName = 'switchArcossHistory' + d.user.toLowerCase();
        let item = {..._switchData};
        if(log.eventName == "TransferIned") {
            updateSwitchCount(1);
            item.ukey = log.chainId + '-' + d.sn;
            item.status = 0;
            item.process = _process.step1_success;
            item.inSn = d.sn;
            item.mode = Number(d.mode);
            item.chainIdIn = Number(log.chainId);
            item.chainIdOut = Number(d.chainId);
            item.tokenIn = d.tokenIn.toLowerCase();
            item.tokenOut = d.tokenOut.toLowerCase();
            item.amountIn = d.amountIn;
            item.amountOut = d.amountOut;
            item.fee = d.fee;
            item.slide = d.slide;
            item.user = d.user.toLowerCase();
            item.txIn = log.transactionHash;
            item.blockIn = log.blockNumber;
            item.timeIn = new Date();
            item.updateTime= new Date();

            let tokenInInfo = await newERC20Token(log.chainId, item.tokenIn).info();
            let tokenOutInfo = await newERC20Token(d.chainId, item.tokenOut).info();
            item.tokenInSymbol = tokenInInfo.symbol;
            item.tokenOutSymbol = tokenOutInfo.symbol;
            item.amountIn = new BigNumber(item.amountIn).shiftedBy(-1 * tokenInInfo.decimals).toFixed();
            item.amountOut = new BigNumber(item.amountOut).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();
            item.fee = new BigNumber(item.fee).shiftedBy(-18).toFixed();
            item.slide = new BigNumber(item.slide).shiftedBy(-1 * tokenOutInfo.decimals).toFixed();

        } else if(log.eventName == "TransferOuted") {
            updateSwitchCount(-1);
            item.ukey = d.chainId + '-' + d.inSn;
        } else {
            console.error('handleHistory unknown log:', log);
            return;
        }

        const local = localStorage.getItem(tableName);
        if (local) {
            let foundI = -1;
            _switchAcrossHistory.forEach((d, i) => {
                if (d.ukey == item.ukey) {
                    foundI = i
                    return
                }
            })
            if (foundI > -1) {
                if(log.eventName == "TransferOuted") {
                    item = {..._switchAcrossHistory[foundI]};
                    item.status = 1;
                    item.process= _process.step2_success;
                    item.outSn = d.sn;
                    item.txOut = log.transactionHash;
                    item.blockOut = log.blockNumber;
                    item.timeOut = new Date();
                    item.updateTime= new Date();

                    if(_switchData.chainIdIn == item.chainIdIn && _switchData.txIn == item.txIn) {
                        _switchData.txOut = item.txOut;
                        _switchData.timeOut = new Date();
                        _switchData.updateTime= new Date();
                        _switchData.process = _process.step2_success;
                    }
                }
                _switchAcrossHistory.splice(foundI, 1)
            }
            _switchAcrossHistory.unshift(item);
            localStorage.setItem(tableName, JSON.stringify(_switchAcrossHistory));
        } else {
            _switchAcrossHistory.unshift(item);
            localStorage.setItem(tableName, JSON.stringify(_switchAcrossHistory));
        }
        console.log('handleHistory set:', item);
    }

    getHistory() {
        return _switchAcrossHistory;
    }

    loadHistory() {
        console.log('loadHistory user:', this.provider.getSelectedAddress());
        if(!this.provider.getSelectedAddress()) {
            return _switchAcrossHistory;
        }
        let tableName = 'switchArcossHistory' + this.provider.getSelectedAddress().toLowerCase();
        const local = localStorage.getItem(tableName);
        if (local) {
            cleanSwitchCount();
            _switchAcrossHistory.splice(0, _switchAcrossHistory.length);
            let _data = JSON.parse(local);
            for(let i=0; i<_data.length; i++) {
                _switchAcrossHistory.push(_data[i]);
                if(_data[i].status == 0) {
                    updateSwitchCount(1);
                }
            }
        }
        return _switchAcrossHistory;
    }

    cleanHistory() {
        let tableName = 'switchArcossHistory' + this.provider.getSelectedAddress().toLowerCase();;
        localStorage.removeItem(tableName);
        _switchAcrossHistory.splice(0, _switchAcrossHistory.length);
    }

    getAcrossTokens() {
        this.envName = this.getEnvName();
        _switchAcrossTokens = SwitchPools[this.envName];
        for (let k in _switchAcrossTokens) {
            if (_switchAcrossTokens[k].opened == true) {
                _switchAcrossTokens[k].name = k
                for (let i=0; i<_switchAcrossTokens[k].list.length; i++) {
                    _switchAcrossTokens[k].list[i].isTicket = _switchAcrossTokens[k].isTicket;
                }
            }
        };
        return _switchAcrossTokens;
    }
}

var _SwitchAcrossInstanes = {}
function newSwitchAcross(chainId) {
    if(!_SwitchAcrossInstanes.hasOwnProperty(chainId)) {
        let provider = Web3Provider(chainId);
        _SwitchAcrossInstanes[chainId] = new SwitchAcross(provider);
        _SwitchAcrossInstanes[chainId].initialize(chainId);
        _SwitchAcrossInstanes[chainId].scanEventLog();
    }
    return _SwitchAcrossInstanes[chainId];
}

export { SwitchAcross, SwitchAcrossHistory, newSwitchAcross }
