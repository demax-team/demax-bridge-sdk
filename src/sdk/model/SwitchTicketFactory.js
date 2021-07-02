import SwitchTicketFactoryABI from '../abi/SwitchTicketFactory.json';
import BigNumber from "bignumber.js"
import BaseByName from './BaseByName';
import { ERC20Token } from './ERC20Token.js';
import { newSwitchTreasury } from './SwitchTreasury.js';
import { newERC20Token } from './ERC20Token.js';
import Web3Provider from '../Web3Provider.js';
import { ContractsAddr, STAKINGTOKENPRE } from '../config/ChainConfig.js';
import { SwitchPools } from '../config/SwitchConfig.js';


var _switchTicketPools = {};
var _switchTicketPoolKeyMap = {};

function asleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getTicketPoolKey(symbol, token, chainId) {
    return (symbol + token + chainId).toLowerCase();
}

function getTicketPoolByKey(symbol, token, chainId) {
    return _switchTicketPoolKeyMap[getTicketPoolKey(symbol,token,chainId)];
}

class SwitchTicketFactory extends BaseByName {
    constructor(provider) {
        console.log('SwitchTicketFactory constructor chainId:', provider.chainId);
        super(provider, SwitchTicketFactoryABI, 'SwitchTicketFactory');
        this.tokenMaps = {};
    }

    async getTokenInfo(token) {
        this.tokenIns = new ERC20Token(this.provider, token);
        return await this.tokenIns.info();
    }

    async getTokenMap(token) {
        token = token.toLowerCase();
        if(!this.tokenMaps.hasOwnProperty(token)) {
            let ticket = await this.contract.methods.getTokenMap(token).call();
            this.tokenMaps[token] = ticket.toLowerCase();
            this.tokenMaps[ticket.toLowerCase()] = token;
        }
        return this.tokenMaps[token];
    }

    async countTicket() {
        return await this.contract.methods.countTicket().call();
    }

    async tickets(i) {
        return await this.contract.methods.tickets(i).call();
    }

    async queryWithdraw(user, ticket) {
        let tokenInfo = await this.getTokenInfo(ticket)
        let amountOut = await this.contract.methods.queryWithdraw(user, ticket).call();
        return new BigNumber(amountOut).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async queryWithdrawInfo(user, ticket) {
        let tokenInfo = await this.getTokenInfo(ticket)
        let res = await this.contract.methods.queryWithdrawInfo(user, ticket).call();
        res.balance = new BigNumber(res.balance).shiftedBy(-1 * tokenInfo.decimals).toFixed();
        res.amount = new BigNumber(res.amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
        return res;
    }

    async deposit(token, value, to) {
        if (!to) {
            to = this.provider.account
        }
        let tokenInfo = await this.getTokenInfo(token)
        let amount = new BigNumber(value).shiftedBy(1 * tokenInfo.decimals)
        let ethValue = new BigNumber(0);
        if (token.toLocaleLowerCase() == this.provider.ZERO_ADDR) {
            ethValue = ethValue.plus(amount)
        }
        let res = await this.provider.executeContract(this.contract, 'deposit', ethValue.toFixed(), [token, amount.toFixed(), to]);
        console.log('deposit:', res);
        this.updateBalanceByKey(tokenInfo.symbol, token, this.provider.chainId, to);
        return res;
    }

    async withdraw(isETH, to, ticket, value) {
        let ticketInfo = await this.getTokenInfo(ticket);
        let token = await this.getTokenMap(ticket);
        let tokenInfo = await this.getTokenInfo(token);
        let amount = new BigNumber(value).shiftedBy(1 * ticketInfo.decimals).toFixed();
        let res = await this.provider.executeContract(this.contract, 'withdraw', 0, [isETH, to, ticket, amount]);
        this.updateBalanceByKey(tokenInfo.symbol, token, this.provider.chainId, to);
        return res
    }

    async getTicketFactoryAddress() {
        return ContractsAddr[this.provider.chainId].SwitchTicketFactory;
    }

    async updateTotal(pool) {
        let tvl = new BigNumber(0);
        let vol = new BigNumber(0);
        for (let i=0; i< pool.list.length; i++) {
            let ele = pool.list[i];
            // console.log('updateTotal:', ele.total, ele);
            tvl = tvl.plus(ele.total);
            vol = vol.plus(ele.total);
        }
        pool.tvl = tvl.toFixed()
        pool.vol = vol.toFixed()
    }

    async updateBalanceByKey(symbol, address, chainId, walletAddr) {
        if(!walletAddr) {
            walletAddr = this.provider.account;
        }
        let ele = getTicketPoolByKey(symbol, address, chainId);
        if(ele) {
            await this.updateBalance(ele, walletAddr);
        }
    }

    async updateBalance(ele, walletAddr) {
        if(!walletAddr) {
            walletAddr = this.provider.account;
        }
        // console.log('updateBalance:', ele, walletAddr);
        let token = newERC20Token(ele.chainId, ele.tokenAddress);
        ele.tokenBalance = await token.balanceOf(walletAddr);
        ele.tokenAllowance = await token.allowance(walletAddr, ContractsAddr[ele.chainId].SwitchTreasury);
        let ticketAddr = await this.getTokenMap(ele.tokenAddress);
        let ticket = newERC20Token(ele.chainId, ticketAddr);
        // let ticketInfo = await ticket.info();
        ele.ticketAddress = ticketAddr;
        ele.ticketBalance = await ticket.tokenBalanceOf(walletAddr);
        ele.ticketSymbol = STAKINGTOKENPRE + ele.name;
        let treasury = newSwitchTreasury(ele.chainId);
        ele.total = await treasury.tokenBalanceOf(ele.tokenAddress);

        await this.updateTotal(_switchTicketPools[ele.name]);
        console.log('switchPool Data:', ele);
    }

    async updateUserAllowance(ele, walletAddr) {
        if(!walletAddr) {
            walletAddr = this.provider.account;
        }
        let token = newERC20Token(ele.chainId, ele.tokenAddress);
        ele.tokenAllowance = await token.allowance(walletAddr, ContractsAddr[ele.chainId].SwitchTreasury);
        return ele;
    }

    async updateData(ele, walletAddr) {
        if(!walletAddr) {
            walletAddr = this.provider.account;
        }
        let token = newERC20Token(this.provider.chainId, ele.tokenAddress);
        let tokenInfo = await token.info();
        ele.tokenSymbol = tokenInfo.symbol;
        ele.tokenBalance = await token.balanceOf(walletAddr);
        ele.tokenAllowance = await token.allowance(walletAddr, ContractsAddr[this.provider.chainId].SwitchTreasury);
        let ticket = newERC20Token(this.provider.chainId, ele.ticketAddress);
        let ticketInfo = await ticket.info();
        ele.ticketSymbol = ticketInfo.symbol;
        ele.ticketBalance = await ticket.tokenBalanceOf(walletAddr);
    }

    async iterateTokenMapData(start, end) {
        let res = await this.contract.methods.iterateTokenMapData(start, end).call();
        let data = [];
        for(let i=0; i<res.length; i++) {
            let d = {
                tokenAddress: token,
                ticketAddress: ticket,
                tokenBalance: '',
                ticketBalance: '',
                tokenAllowance: '',
            };
            this.updateData(d);
            data.push(d);
        }
        return data;
    }
}

class SwitchTicketPools {
    constructor(provider) {
        this.provider = provider;
        this.envName = 'main';
    }

    getEnvName() {
        if([42,97,256].includes(this.provider.chainId)) {
            return 'test';
        }
        return 'main';
    }

    getPools() {
        this.envName = this.getEnvName();
        _switchTicketPools = SwitchPools[this.envName];
        return _switchTicketPools;
    }

    async updateUserAllowance(pool, walletAddr) {
        if(!walletAddr) {
            walletAddr = this.provider.account
        }
        let _tokenIns = new ERC20Token(this.provider, pool.tokenAddress)
        pool.tokenAllowance = await _tokenIns.allowance(this.provider.account, this.provider.getContractAddr('SwitchTreasury'))
        return pool
    }

    async getSwitchPools(walletAddr) {
        this.getPools();
        for (let k in _switchTicketPools) {
            if (_switchTicketPools[k].opened == true) {
                _switchTicketPools[k].name = k
                _switchTicketPools[k].apr = '0';
                _switchTicketPools[k].tvl = '0';
                _switchTicketPools[k].vol = '0';
                for (let i=0; i<_switchTicketPools[k].list.length; i++) {
                    _switchTicketPools[k].list[i].isTicket = _switchTicketPools[k].isTicket;
                    _switchTicketPools[k].list[i].total = '0';
                    _switchTicketPools[k].list[i].tokenBalance = '0';
                    _switchTicketPools[k].list[i].tokenAllowance = '0';
                    _switchTicketPools[k].list[i].ticketAddress = '';
                    _switchTicketPools[k].list[i].ticketBalance = '0';
                    _switchTicketPools[k].list[i].ticketSymbol = '';
                    if(!_switchTicketPools[k].list[i].hasOwnProperty('tokenSymbol')) {
                        _switchTicketPools[k].list[i].tokenSymbol = _switchTicketPools[k].list[i].name;
                    }
                    _switchTicketPoolKeyMap[getTicketPoolKey(_switchTicketPools[k].list[i].tokenSymbol, _switchTicketPools[k].list[i].tokenAddress, _switchTicketPools[k].list[i].chainId)] = _switchTicketPools[k].list[i];
                    if(walletAddr && _switchTicketPools[k].isTicket == false) {
                        try {
                            newSwitchTicketFactory(_switchTicketPools[k].list[i].chainId).updateBalance(_switchTicketPools[k].list[i], walletAddr);
                        } catch(e) {
                            console.error('updateBalance except:', _switchTicketPools[k].list[i], e);
                        }

                    }
                }
            }
        };
        return _switchTicketPools;
    }

    async getSwitchTokens() {
        let network = this.getEnvName();
        let res = []
        await this.getSwitchPools()
        for (let k in SwitchPools[network]) {
            if (SwitchPools[network][k].opened) {
                SwitchPools[network][k].name = k
                res.push(SwitchPools[network][k])
            }
        }
        return res;
    }

}

var _SwitchTicketFactory = {}
function newSwitchTicketFactory(chainId, account) {
    chainId = Number(chainId);
    if(!_SwitchTicketFactory.hasOwnProperty(chainId)) {
        let provider = Web3Provider(chainId, account);
        _SwitchTicketFactory[chainId] =  new SwitchTicketFactory(provider);
    }
    _SwitchTicketFactory[chainId].initialize(chainId, account);
    return _SwitchTicketFactory[chainId];
}

export { SwitchTicketFactory, SwitchTicketPools, newSwitchTicketFactory }
