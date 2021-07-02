import SwitchTreasuryABI from '../abi/SwitchTreasury.json';
import BigNumber from "bignumber.js"
import BaseByName from './BaseByName';
import Web3Provider from '../Web3Provider.js';
import { ERC20Token } from './ERC20Token.js';

class SwitchTreasury extends BaseByName {
    constructor(provider) {
        super(provider, SwitchTreasuryABI, 'SwitchTreasury');
    }

    async getTokenInfo(token) {
        let tokenIns = new ERC20Token(this.provider, token);
        return await tokenIns.info();
    }

    async tokenBalanceOf(token) {
        let tokenIns = new ERC20Token(this.provider, token);
        return await tokenIns.balanceOf(this.address);
    }

    async queryWithdraw(_user, _token) {
        return await this.contract.methods.queryWithdraw(_user, _token).call();
    }
}

var _SwitchTreasuryInstanes = {}
function newSwitchTreasury(chainId) {
    if(!_SwitchTreasuryInstanes.hasOwnProperty(chainId)) {
        let provider = Web3Provider(chainId);
        _SwitchTreasuryInstanes[chainId] = new SwitchTreasury(provider);
        _SwitchTreasuryInstanes[chainId].initialize(chainId);
    }
    return _SwitchTreasuryInstanes[chainId];
}

export { SwitchTreasury, newSwitchTreasury }
