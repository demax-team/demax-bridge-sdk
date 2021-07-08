import chainWeb3 from './ChainWeb3.js'
import { ERC20Token, newERC20Token } from './model/ERC20Token.js'
import { SwitchTicketFactory, newSwitchTicketFactory } from './model/SwitchTicketFactory.js'
import { SwitchFarm, newSwitchFarm } from './model/SwitchFarm.js'
import { SwitchAcross } from './model/SwitchAcross.js'
import { SwitchTreasury } from './model/SwitchTreasury.js'
import { newSwitchQuery } from './model/SwitchQuery.js'

var _InstancesCache = {}
function ERC20TokenIns(address) {
  let ins = _getInstance('ERC20Token', address);
  if (!ins) {
    ins = new ERC20Token(chainWeb3, address);
    _setInstance('ERC20Token', address, ins);
  }
  return ins
}

function _getInstance(name, address) {
  if (_InstancesCache.hasOwnProperty(name + address.toLocaleLowerCase())) {
    return _InstancesCache[name + address.toLocaleLowerCase()];
  }
  return null;
}

function _setInstance(name, address, ins) {
  console.log('_setInstance:----', name, address);
  _InstancesCache[name + address.toLocaleLowerCase()] = ins;
}
var ChainApi = {
  chainWeb3: chainWeb3,
  ERC20Token: ERC20TokenIns,
  NewSwitchQuery: newSwitchQuery,
  NewERC20Token: newERC20Token,
  NewSwitchFarm: newSwitchFarm,
  NewSwitchTicketFactory: newSwitchTicketFactory,
  switchAcross: new SwitchAcross(chainWeb3),
  switchTreasury: new SwitchTreasury(chainWeb3),
  switchTicketFactory: new SwitchTicketFactory(chainWeb3),
  switchFarm: new SwitchFarm(chainWeb3),
}

export default ChainApi
