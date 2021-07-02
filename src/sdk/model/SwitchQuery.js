import SwitchQueryABI from '../abi/SwitchQuery.json';
import BigNumber from "bignumber.js"
import Web3Provider from '../Web3Provider.js';
import BaseByName from './BaseByName';

class SwitchQuery extends BaseByName {
  constructor(provider) {
      super(provider, SwitchQueryABI, 'SwitchQuery');
  }

  async getTokenPrice(pair, token) {
    if (!pair || pair==this.provider.ZERO_ADDR || !token) {
      return '0'
    }

    let res = await this.contract.methods.getSwapPairReserve(pair).call()
    let d0 = new BigNumber(res.decimals0)
    let d1 = new BigNumber(res.decimals1)
    let r0 = new BigNumber(res.reserve0)
    let r1 = new BigNumber(res.reserve1)
    let offset = d0.minus(d1)
    r1 = r1.multipliedBy(new BigNumber(10).pow(offset))
    if (token.toLocaleLowerCase() === res.token0.toLocaleLowerCase()) {
      return r1.dividedBy(r0).toFixed()
    } else {
      return r0.dividedBy(r1).toFixed()
    }
  }

}

var _SwitchQuery = {}
function newSwitchQuery(chainId, account) {
    chainId = Number(chainId);
    if(!_SwitchQuery.hasOwnProperty(chainId)) {
        let provider = Web3Provider(chainId, account);
        _SwitchQuery[chainId] =  new SwitchQuery(provider);
    }
    _SwitchQuery[chainId].initialize(chainId, account);
    return _SwitchQuery[chainId];
}

export { SwitchQuery, newSwitchQuery }