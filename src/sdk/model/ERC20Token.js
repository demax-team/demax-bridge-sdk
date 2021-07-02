import ERC20TokenABI from '../abi/ERC20Token.json';
import BigNumber from "bignumber.js";
import BaseInstance from './BaseInstance';
import Web3Provider from '../Web3Provider.js';

class ERC20Token extends BaseInstance {
    constructor(provider, address) {
        super(provider, ERC20TokenABI, address);
    }

    async balanceOf(user) {
        if (!user) {
            user = this.provider.account;
        }
        let _token = await this.info();
        let res = '0'
        if (this.provider.isZeroAddress(this.address)) {
            res = await this.provider.web3.eth.getBalance(user);
        } else {
            res = await this.contract.methods.balanceOf(user).call();
        }
        return new BigNumber(res).shiftedBy(-1 * _token.decimals).toFixed();
    }

    async tokenBalanceOf(user) {
        if (!user) {
            user = this.provider.account;
        }
        let _token = await this.info();
        let res = '0'
        if (!this.provider.isZeroAddress(this.address)) {
            res = await this.contract.methods.balanceOf(user).call();
        }
        return new BigNumber(res).shiftedBy(-1 * _token.decimals).toFixed();
    }

    async showBalanceOf(fmt, user) {
        let d = await this.info();
        return new BigNumber(await this.balanceOf(user)).shiftedBy(-1 * d.decimals).toFixed(fmt);
    }

    async info() {
        let cache = this.provider.tokens[this.address.toLocaleLowerCase()];
        if (cache) {
            return cache;
        }
        let res = {};
        if (this.provider.isZeroAddress(this.address)) {
            res = {
                address: this.address,
                symbol: this.provider.getZeroSymbol(),
                totalSupply: 0,
                decimals: 18
            };
        } else {
            res = {
                address: this.address,
                symbol: await this.contract.methods.symbol().call(),
                totalSupply: await this.contract.methods.totalSupply().call(),
                decimals: await this.contract.methods.decimals().call()
            };
        }
        this.provider.tokens[this.address.toLocaleLowerCase()] = res;
        return res;
    }

    async approve(spender) {
        // console.log('approve:', token, spender)
        if (!spender) {
            throw ('Illegal approve');
        }

        let total = await this.contract.methods.totalSupply().call();
        // console.log('total:', total);
        return await this.provider.executeContract(this.contract, 'approve', 0, [spender, total]);
    }

    async allowance(user, spender) {
        // console.log('allowance:', spender, user);
        if (this.provider.isZeroAddress(this.address)) {
            return new BigNumber(10).shiftedBy(30).toFixed();
        }
        let _token = await this.info();
        let res = await this.contract.methods.allowance(user, spender).call();
        return new BigNumber(res).shiftedBy(-1 * _token.decimals).toFixed();
    }

    async transfer(to, amount) {
        let _token = await this.info()
        amount = new BigNumber(amount).shiftedBy(1 * _token.decimals).toFixed();
        return await this.provider.executeContract(this.contract, 'transfer', 0, [to, amount]);
    }
}

function newERC20Token(chainId, token) {
    let provider = Web3Provider(chainId);
    let ins = new ERC20Token(provider, token);
    return ins;
}

export { ERC20Token, newERC20Token }
