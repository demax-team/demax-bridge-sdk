import SwitchTicketFactoryABI from '../abi/SwitchTicketFactory.json';
import BigNumber from "bignumber.js"
import BaseByName from './BaseByName';
import { ERC20Token } from './ERC20Token.js';
import { newERC20Token } from './ERC20Token.js';
import Web3Provider from '../Web3Provider.js';
import { ContractsAddr, STAKINGTOKENPRE } from '../config/ChainConfig.js';

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
        return res;
    }

    async withdraw(isETH, to, ticket, value) {
        let ticketInfo = await this.getTokenInfo(ticket);
        let token = await this.getTokenMap(ticket);
        let tokenInfo = await this.getTokenInfo(token);
        let amount = new BigNumber(value).shiftedBy(1 * ticketInfo.decimals).toFixed();
        let res = await this.provider.executeContract(this.contract, 'withdraw', 0, [isETH, to, ticket, amount]);
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
                tokenAddress: '',
                ticketAddress: '',
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

export { SwitchTicketFactory, newSwitchTicketFactory }
