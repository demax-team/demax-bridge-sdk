import SwitchFarmABI from '../abi/SwitchFarm.json';
import BigNumber from "bignumber.js"
import BaseByName from './BaseByName';
import { ERC20Token } from './ERC20Token.js';
import Web3Provider from '../Web3Provider.js';
import { newSwitchAcross } from './SwitchAcross';

let _farmData = {};
class SwitchFarm extends BaseByName {
    constructor(provider) {
        super(provider, SwitchFarmABI, 'SwitchFarm');
        this.pool = null;
    }

    async getTokenInfo(token) {
        // console.log('token==>', token)
        this.tokenIns = new ERC20Token(this.provider, token);
        return await this.tokenIns.info();
    }

    async queryWithdraw(user, ticket) {
        let tokenInfo = await this.getTokenInfo(ticket);
        let amountOut = await this.contract.methods.queryWithdraw(user, ticket).call();
        return new BigNumber(amountOut).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async deposit(pool, amount) {
        let user = this.provider.account;
        console.log('deposit:', amount, pool, user);
        let token = pool.depositToken;
        let tokenInfo = await this.getTokenInfo(token);
        amount = new BigNumber(amount).shiftedBy(1 * tokenInfo.decimals).toFixed();
        let res = await this.provider.executeContract(this.contract, 'deposit', 0, [pool.pid, amount, user]);
        this.farmUpdatePool(pool);
        return res;
    }

    async withdraw(pool, amount) {
        let user = this.provider.account;
        let token = pool.depositToken;
        let tokenInfo = await this.getTokenInfo(token);
        amount = new BigNumber(amount).shiftedBy(1 * tokenInfo.decimals).toFixed();
        let res = await this.provider.executeContract(this.contract, 'withdraw', 0, [pool.pid, amount, user]);
        this.farmUpdatePool(pool);
        return res;
    }

    async pendingReward(pool) {
        let user = this.provider.account;
        console.log('pendingReward user:', user);
        let token = pool.depositToken;
        let tokenInfo = await this.getTokenInfo(token);
        let amount = await this.contract.methods.pendingReward(pool.pid, user).call();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async pendingEarn(pool) {
        let user = this.provider.account;
        let token = pool.earnToken;
        let tokenInfo = await this.getTokenInfo(token);
        let amount = await this.contract.methods.pendingEarn(pool.pid, user).call();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async harvest(pool) {
        let user = this.provider.account;
        let res = await this.provider.executeContract(this.contract, 'harvest', 0, [pool.pid, user]);
        this.farmUpdatePool(pool);
        return res;
    }

    async getTokenUSDPrice(addr) {
        return 1;
    }

    async getLpUSDValue(depositToken, totalStake, rewardPrice) {
        return 1;
    }

    async farmPoolRewardApr(poolData, farmData) {
        if(farmData.mintPerBlock == 0 || farmData.totalAllocPoint == 0 || farmData.totalSupply == 0 || farmData.rewardPrice == 0) {
            // console.log('poolRewardApr param is 0 ', farmData, poolData.totalStake, farmData.rewardPrice)
            return '0'
        }

        let rewardTokenDecimals = 18 //todo
        let aYearAmount = new BigNumber(farmData.mintPerBlock).shiftedBy(-1*rewardTokenDecimals).div(this.provider.getBlockSpanTime()).multipliedBy(24*3600*365)
        aYearAmount = aYearAmount.multipliedBy(poolData.weight).div(farmData.totalAllocPoint)
        let earned = aYearAmount.multipliedBy(farmData.rewardPrice)
        let apy = earned.toFixed(2)
        if(poolData.totalStakeValue > 0) {
            // console.log('poolRewardApr earned is ', poolData.tokenSymbol+'/'+poolData.baseSymbol, earned.toFixed(), farmData.rewardPrice)
            apy = earned.div(new BigNumber(poolData.totalStakeValue)).multipliedBy(100).toFixed(2)
        }
        return apy
    }

    async farmPoolEarnApr(poolData, farmData) {
        if(farmData.totalAllocPoint == 0 || farmData.totalSupply == 0) {
            // console.log('poolRewardApr param is 0 ', farmData, poolData.totalStake)
            return '0'
        }
        let earnToken = await this.getTokenInfo(poolData.earnToken)
        let pendingEarn = await newSwitchAcross(poolData.chainId).totalSlideOfToken(poolData.earnToken);
        let mintPerBlock = new BigNumber(pendingEarn).dividedBy(await this.provider.getBlockNumber() - poolData.lastBlock);
        let aYearAmount = new BigNumber(mintPerBlock).shiftedBy(-1*earnToken.decimals).div(this.provider.getBlockSpanTime()).multipliedBy(24*3600*365)
        aYearAmount = aYearAmount.multipliedBy(poolData.weight).div(farmData.totalAllocPoint)
        let earned = aYearAmount.multipliedBy(1)
        let apy = earned.toFixed(2)
        if(poolData.totalStakeValue > 0) {
            apy = earned.div(new BigNumber(poolData.totalStakeValue)).multipliedBy(100).toFixed(2)
        }
        return apy
    }

    async farmPoolApr(poolData, farmData) {
        let rewardApr = await this.farmPoolRewardApr(poolData, farmData);
        let earnApr = await this.farmPoolEarnApr(poolData, farmData);
        return new BigNumber(rewardApr).plus(earnApr).toFixed(2);
    }

    async farmUpdatePool(pool) {
        let pid = pool.pid
        let farmData = await this.getFarmData()
        let userInfo = await this.contract.methods.userInfo(pid, this.provider.account).call()
        let poolInfo = await this.contract.methods.poolInfo(pid).call()
        pool.chainId = this.provider.chainId
        pool.depositToken = poolInfo.depositToken
        pool.earnToken = poolInfo.earnToken
        pool.lastBlock = poolInfo.lastBlock
        let pendingUserEarn = await this.pendingEarn(pool)
        let rewardTokenDecimals = 18
        let depositToken = await this.getTokenInfo(poolInfo.depositToken)
        let rewardToken = await this.getTokenInfo(farmData.rewardToken)
        let earnToken = await this.getTokenInfo(poolInfo.earnToken)
        pool.depositSymbol = depositToken.symbol;
        pool.rewardSymbol = rewardToken.symbol
        pool.earnSymbol = earnToken.symbol
        pool.earnDecimals = earnToken.decimals
        pool.depositDecimals = depositToken.decimals
        let pendingUserReward = await this.pendingReward(pool)
        let _depositTokenIns = new ERC20Token(this.provider, poolInfo.depositToken)
        pool.userBalance = await _depositTokenIns.balanceOf(this.provider.account)
        pool.userAmount = new BigNumber(userInfo.amount).shiftedBy(-1*depositToken.decimals).toFixed()
        pool.userReward = new BigNumber(pendingUserReward).shiftedBy(-1*rewardTokenDecimals).toFixed()
        pool.userEarn = new BigNumber(pendingUserEarn).shiftedBy(-1*earnToken.decimals).toFixed()
        let totalStake = poolInfo.depositTokenSupply
        let depositTokenPrice = '0'
        if(poolInfo.depositToken.toLocaleLowerCase()==rewardToken.address.toLocaleLowerCase()) {
            depositTokenPrice = farmData.rewardPrice
        } else if(poolInfo.depositToken.toLocaleLowerCase()==earnToken.address.toLocaleLowerCase()) {
            depositTokenPrice = farmData.earnPrice
        } else {
            depositTokenPrice = await this.getTokenUSDPrice(poolInfo.depositToken)
        }

        let totalStakeValue = new BigNumber(totalStake).shiftedBy(-1*depositToken.decimals).multipliedBy(depositTokenPrice).toFixed(2)

        pool.totalStake = new BigNumber(totalStake).shiftedBy(-1*depositToken.decimals).toFixed()
        pool.totalStakeValue = totalStakeValue
        pool.weight = poolInfo.allocPoint
        pool.userAllowance = await _depositTokenIns.allowance(this.provider.account, this.address)
        pool.apy = await this.farmPoolApr(pool, farmData)

        // console.log('updatePool:', pool)
        return pool
    }

    async updateUserAllowance(pool) {
        let _depositTokenIns = new ERC20Token(this.provider, pool.depositToken)
        pool.userAllowance = await _depositTokenIns.allowance(this.provider.account, this.address)
        return pool
    }

    async getFarmData() {
        let rewardPrice = 0;
        let earnPrice = 1;
        if(!_farmData.hasOwnProperty(this.provider.chainId)) {
            _farmData[this.provider.chainId] = {
                totalAllocPoint: await this.contract.methods.totalAllocPoint().call(),
                mintPerBlock: await this.contract.methods.mintPerBlock().call(),
                rewardTotal: await this.contract.methods.rewardTotal().call(),
                rewardToken: await this.contract.methods.rewardToken().call(),
                rewardPrice: rewardPrice,
                earnPrice: earnPrice,
            }
        }
        return _farmData[this.provider.chainId];
    }

    async iterateFarms(start, end) {
        let count = await this.contract.methods.poolLength().call();
        count = Number(count);
        if(end > count) {
            end = count;
        }
        let data = [];
        for(let i = start; i < end; i++) {
            let d = {
                pid: i,
            };
            this.farmUpdatePool(d);
            data.push(d);
        }
        return data;
    }
}


var _SwitchFarm = {}
function newSwitchFarm(chainId, account) {
    chainId = Number(chainId);
    if(!_SwitchFarm.hasOwnProperty(chainId)) {
        let provider = Web3Provider(chainId, account);
        _SwitchFarm[chainId] =  new SwitchFarm(provider);
    }
    _SwitchFarm[chainId].initialize(chainId, account);
    return _SwitchFarm[chainId];
}

export { SwitchFarm, newSwitchFarm }
