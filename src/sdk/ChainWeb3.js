import Web3 from 'web3'
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import web3Util from './Web3Util.js'
import { CHAIN_RPC, CHAIN_BROWSER, CHAIN_NAME, ContractsAddr, ChainSymbol } from './config/ChainConfig.js'

var chainWeb3 = null;

function transactionReceiptAsync(web3, hash, resolve, reject) {
    web3.eth.getTransactionReceipt(hash).then(receipt => {
        if (!receipt) {
            setTimeout(function () {
                transactionReceiptAsync(web3, hash, resolve, reject)
            }, 1000);
        } else {
            if (receipt && !receipt.status) {
                reject(receipt)
            } else {
                resolve(receipt)
            }
        }
    }).catch(reject)
}
class ChainWeb3 {
    constructor() {
        this.tryCount = 0;
        this.chainInstalled = false;
        this.connector = null;
        this.ethereum = null;
        this.ZERO_ADDR = "0x0000000000000000000000000000000000000000";
        this.account = '';
        this.accounts = [];
        this.chainId = 0;
        this.tokens = [];
        this.web3 = null;
        this.web3Util = web3Util;
        this.contractHistory = []
        this.chainStatusHandles = [];
        this.accountsHandles = [];
        this.chainHandles = [];
        this.apiModules = [];
        this.myWallets = {};
    }

    setSession(key, val) {
        if (val !== undefined) {
            sessionStorage.setItem(key, val);
        }
    }

    getSession(key) {
        return sessionStorage.getItem(key);
    }

    handleChainStatus(status) {
        console.log('handleChainStatus:', status)
        for (const cb of this.chainStatusHandles) {
            cb(status)
        }
    }

    registerModule(module) {
        this.apiModules.push(module);
    }

    initModules(chainId) {
        console.log('initModules...', chainId, this);
        for (let module of this.apiModules) {
            module.initialize(chainId);
        }
        for (let module of this.apiModules) {
            module.initAfter();
        }
    }

    cleanModules(chainId) {
        console.log('cleanModules...', chainId, this);
        for (let module of this.apiModules) {
            module.clean();
        }
    }

    handleNewChain(chainId) {
        // console.log('handleNewChain:---->', chainId, this);
        if (!chainId) {
            chainWeb3.cleanModules();
            return
        }
        let cid = Number(chainId)
        console.log('handleNewChain:', this.chainId, cid, chainWeb3.chainId);
        this.chainId = cid

        chainWeb3.initModules(cid)

        for (const cb of chainWeb3.chainHandles) {
            cb(chainId)
        }
    }

    walletConnectInit() {
        const bridge = 'https://bridge.walletconnect.org';
        this.connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });
        // check if already connected
        let newAccounts = []
        if (!this.connector.connected) {
            console.log('walletConnectInit connect...', this);
            // create new session
            this.connector.createSession()
            // Subscribe to connection events
            this.connector.on('connect', (error, payload) => {
                console.log(`this.connector.on("connect")`,);
                console.log(JSON.stringify(payload));
                const { accounts, chainId } = payload.params[0];
                newAccounts = accounts
                this.handleNewChain(chainId)
                this.handleChainStatus(true)
                this.handleNewAccounts(accounts)
            })
            // this.handleNewAccounts(newAccounts)
            this.connector.on('session_update', (error, payload) => {
                const { accounts, chainId } = payload.params[0];
                console.log('walletConnectInit session_update:', accounts);
                this.handleNewChain(chainId)
                this.handleNewAccounts(accounts)
            });
            this.connector.on('disconnect', (error, payload) => {
                console.log(`this.connector.on("disconnect")`);
                console.log('walletConnectInit disconnect');
                this.handleNewAccounts([])
            });
        } else {
            newAccounts = this.connector.accounts
            console.log('walletConnectInit connected:', newAccounts);
            this.handleChainStatus(true)
            this.handleNewAccounts(newAccounts)

        }

        console.log('walletConnectInit account:', newAccounts)
        return newAccounts
    }

    connectMetamask() {
        if (!window.ethereum) {
            console.log('not found Metamask')
            if (this.tryCount < 1) {
                setTimeout(() => {
                    this.connectMetamask()
                    this.tryCount++
                }, 2000)
            } else {
                console.log('not found Metamask, timeout')
                this.handleChainStatus(false)
            }
        } else {
            this.ethereum = window.ethereum
            this.chainConnected()
        }
    }

    connectBinance() {
        if (!window.BinanceChain) {
            console.log('not found Binance')
            if (this.tryCount < 1) {
                setTimeout(() => {
                    this.connectBinance()
                    this.tryCount++
                }, 2000)
            } else {
                console.log('not found Binance, timeout')
                this.handleChainStatus(false)
            }
        } else {
            this.ethereum = window.BinanceChain
            this.chainConnected()
        }
    }

    chainConnected() {
        console.log('chain connected...')
        this.chainInstalled = true
        // console.log('ethereum:', this.ethereum)
        // console.log('ethereum chainId:', this.ethereum.chainId)
        this.web3 = new Web3(this.ethereum)

        this.ethereum.autoRefreshOnNetworkChange = false
        if (navigator.userAgent.indexOf('BitKeep') == -1) {
            this.ethereum.on('chainChanged', chainWeb3.handleNewChain)
            this.ethereum.on('accountsChanged', chainWeb3.handleNewAccounts)
        }

        this.handleChainStatus(true)
        console.log('this.chainInstalled:', this.chainInstalled)
        console.log('this.ethereum:', this.ethereum)

        console.log('chainClient:', this.getSession('chainClient'))


        if (this.ethereum.chainId) {
            console.log('ethereum chainid', this.ethereum.chainId)
            chainWeb3.handleNewChain(this.ethereum.chainId)
        } else {
            this.web3.eth.getChainId().then((chainId) => {
                console.log('web chainid', chainId)
                chainWeb3.handleNewChain(chainId)
            }).catch(e => {
                console.log('web3 chainid except:', e)
            })
        }
    }

    handleNewAccounts(newAccounts) {
        console.log('handleNewAccounts:', chainWeb3.getNetworkVersion(), newAccounts);
        chainWeb3.accounts = newAccounts
        if (newAccounts && newAccounts.length > 0) {
            if (chainWeb3.account != newAccounts[0]) {
                chainWeb3.initModules(chainWeb3.getNetworkVersion());
            }
            chainWeb3.account = newAccounts[0];
            const local = localStorage.getItem('myWallets');
            if (local) {
                Object.assign(chainWeb3.myWallets, JSON.parse(local));
            }
            chainWeb3.myWallets[chainWeb3.account.toLowerCase()] = new Date().getTime();
            localStorage.setItem('myWallets', JSON.stringify(chainWeb3.myWallets));
            chainWeb3.loadContractHistory();
        } else {
            chainWeb3.account = ''
        }
        for (const cb of chainWeb3.accountsHandles) {
            cb(newAccounts)
        }
    }

    connectChain(to = '') {
        this.tryCount = 0
        if (!to) {
            to = this.getSession('chainClient')
            if (!to) {
                to = 'm'
            }
        }
        console.log('connectChain:', to)
        this.setSession('chainClient', to)
        if (to == 'b') {
            this.connectBinance()
        } else if (to == 'm') {
            this.connectMetamask()
        } else if (to == 'w') {
            this.walletConnectInit()
        }
    }

    connect(to = ''){
        console.log('ChainWeb3 ...')
        if (!to) {
            to = this.getSession('chainClient')
            if (!to) {
                to = 'm'
            }
        }
        if (this.isConnected()) {
            console.log('ChainWeb3 isConnected')
            return Promise.resolve(this.accounts)
        }
        console.log('ChainWeb3 connect to:', to)
        this.setSession('chainClient', to)
        this.tryCount = 0
        if (to === 'm') {
            this.connectMetamask()
            if (!this.chainInstalled) {
                console.log('No Provider!')
                return Promise.reject('No Provider!')
            }
        } else if (to === 'b') {
            this.connectBinance()
            if (!this.chainInstalled) {
                console.log('No Provider!')
                return Promise.reject('No Provider!')
            }
        } else if (to === 'w') {
            return Promise.resolve(this.walletConnectInit())
        }

        if (this.chainInstalled) {
            console.log('connect...')
            return this.ethereum.request({
                method: 'eth_requestAccounts',
            }).then(newAccounts => {
                console.log('connect accounts', newAccounts)
                this.handleNewAccounts(newAccounts)
                return newAccounts
            })
        }

    }

    disconnect() {
        if (this.connector && this.connector.connected) {
            console.log('disconnect this.connector')
            this.connector.killSession()
        }
        this.chainInstalled = false
        this.handleNewAccounts([])
    }

    handleEventLog(abi, receipt, contractName, eventName) {
        if (!receipt) {
            console.warn('handleEventLog receipt is null ', contractName, eventName)
            return
        }
        let result = web3Util.parseEventLog(this.web3, abi, receipt, eventName)
        // console.log('handleEventLog:', contractName, eventName, result)
        let hash = result.hash
        let type = contractName.toLocaleUpperCase() + '_' + eventName.toLocaleUpperCase()
        let tableName = this.chainId + this.getSelectedAddress();
        const item = {
            hash: hash,
            time: new Date().getTime(),
            type: type,
            data: result.data,
            address: result.address
        };
        // console.log('handleEventLog item:', item)
        const local = localStorage.getItem(tableName);
        if (local) {
            const list = JSON.parse(local);
            list.unshift(item);
            localStorage.setItem(tableName, JSON.stringify(list));
        } else {
            const list = [];
            list.unshift(item);
            localStorage.setItem(tableName, JSON.stringify(list));
        }
    }

    onChainStatus(handleChainStatus) {
        this.chainStatusHandles.push(handleChainStatus)
    }

    onAccountsChanged(handleNewAccounts) {
        console.log('onAccountsChanged:', this.accountsHandles)
        this.accountsHandles.push(handleNewAccounts)
    }

    onChainChanged(handleChain) {
        this.chainHandles.push(handleChain)
    }

    on(event, handler) {
        this.ethereum.on(event, handler)
    }

    getAccounts() {
        console.log('getAccounts')
        if (this.accounts.length > 0) {
            return Promise.resolve(this.accounts)
        }
        if (this.connector && this.connector.connected) {
            return Promise.resolve(this.connector.accounts)
        }
        if (this.chainInstalled) {
            return this.ethereum.request({
                method: 'eth_accounts',
            })
        }
        return Promise.resolve([])
    }

    isChainConnected() {
        console.log('isChainConnected')
        if (this.connector && this.connector.connected) {
            return true
        }
        if (window.ethereum) {
            this.chainInstalled = true
            return true
        }
        this.chainInstalled = false
        return false
    }

    isConnected() {
        console.log('isConnected')
        if (this.connector && this.connector.connected) {
            return true
        }
        if (!this.chainInstalled) {
            return false
        }
        return this.accounts.length > 0
    }

    getEtherscanAddress(address, chainId) {
        if (!chainId) {
            chainId = this.getNetworkVersion()
        }
        address = address || this.accounts[0]
        return CHAIN_BROWSER[chainId] + '/address/' + address
    }

    getEtherscanTx(tx, chainId) {
        if (!chainId) {
            chainId = this.getNetworkVersion()
        }
        return CHAIN_BROWSER[chainId] + '/tx/' + tx
    }

    awaitTransactionMined(hash) {
        let web3 = this.getWeb3();
        return new Promise(function (resolve, reject) {
            transactionReceiptAsync(web3, hash, resolve, reject)
        })
    }

    getWeb3(force = false) {
        if (!this.web3 || force) {
            this.chainId = this.getNetworkVersion();
            console.log('new web3:', this.chainId, this);
            this.web3 = new Web3(CHAIN_RPC[this.chainId])

            this.initModules(this.chainId)
        }
        return this.web3
    }

    getSelectedAddress() {
        if (this.accounts.length > 0) {
            return this.accounts[0]
        } else if (this.connector && this.connector.connected && this.connector.accounts.length > 0) {
            return this.connector.accounts[0]
        } else if (this.ethereum) {
            return this.ethereum.selectedAddress
        }
        console.log('this.getSelectedAddress is null')
        return ''
    }

    getContract(abi, address) {
        if (!abi || !address) {
            throw ('Illegal getContract address:', address);
        }
        const web3 = this.getWeb3()
        return new web3.eth.Contract(abi, address)
    }

    getNetworkVersion() {
        let version = 0 // unknown
        if (this.connector && this.connector.connected) {
            // console.log('this.connector chainId:', this.connector.chainId)
            version = Number(this.connector.chainId)
        } else if (this.chainInstalled) {
            version = Number(this.ethereum.chainId)
        }
        // console.log('getNetworkVersion:', version)
        return version
    }

    sendTransaction(params) {
        if (this.connector && this.connector.connected) {
            console.log('sendTransaction this.connector params:', params)
            return this.connector.sendTransaction(params[0])
        }
        console.log('sendTransaction params:', params)
        return this.ethereum
            .request({
                method: 'eth_sendTransaction',
                params,
            })
    }

    async executeContract(contract, methodName, value, params, cb) {
        console.log('executeContract:', methodName, value, params)
        if (!value) {
            value = 0
        }
        value = web3Util.numberToHex(value)
        const transParams = {
            from: this.getSelectedAddress(),
            value: value,
        };
        if (contract) {
            transParams['to'] = contract._address
            transParams['data'] = contract.methods[methodName](...params).encodeABI()
        }
        let hash = await this.sendTransaction([transParams])
        let inputData = {
            chainId: this.getNetworkVersion(),
            transactionHash: hash,
            inputValues: params,
        }
        if (cb) {
            cb(inputData)
        }
        this.handleCall(hash, methodName, 0)
        let reciept = await this.awaitTransactionMined(hash)
        // console.log('executeContract reciept:', reciept)
        let status = 2
        if (reciept.status) {
            status = 1
        }
        if (cb) {
            cb({ ...inputData, ...reciept })
        }
        this.handleCall(hash, methodName, status)
        return reciept
    }

    getContractMethods(abi, address) {
        const web3 = this.getWeb3()
        return new web3.eth.Contract(abi, address).methods
    }

    getContractAddr(name) {
        return ContractsAddr[this.getNetworkVersion()][name]
    }

    getZeroSymbol() {
        return ChainSymbol.ZeroToken[this.getNetworkVersion()]
    }

    getWSymbol() {
        return ChainSymbol.WToken[this.getNetworkVersion()]
    }

    isZeroAddress(addr) {
        return addr == this.ZERO_ADDR;
    }

    async getBlockNumber() {
        let res = await this.web3.eth.getBlockNumber();
        return Number(res);
    }

    getBlockSpanTime() {
        if (this.chainId == 1) {
            return 13.5;
        }
        return 3;
    }

    getBlockToTimes(start, end) {
        let now = new Date().getTime();
        let spanTime = (Number(end) - Number(start)) * this.getBlockSpanTime();
        return now + parseInt(spanTime * 1000);
    }

    async getNowToEndBlockTime(block) {
        let currentBlock = await this.getBlockNumber();
        return this.getBlockToTimes(currentBlock, block);
    }

    getBlockNumbers(blockNumber, blockTime, targetTime) {
        let diff = (targetTime - blockTime) / 1000 / this.getBlockSpanTime();
        return Number(blockNumber) + parseInt(diff);
    }

    getBlockNumberCount(blockTime, targetTime) {
        return parseInt((targetTime - blockTime) / 1000 / this.getBlockSpanTime());
    }

    // status, 0: pending 1:success 2:fail
    handleCall(hash, methodName, status = 0) {
        if (!hash) {
            console.warn('handleCall hash is null ', hash, methodName)
            return
        }
        let tableName = 'contractCall' + this.getSelectedAddress();
        const item = {
            chainId: this.chainId,
            hash: hash,
            time: new Date().getTime(),
            status: status,
            funcName: methodName,
            data: null
        };
        // console.log('handleEventLog item:', item)
        const local = localStorage.getItem(tableName);
        if (local) {

            let foundI = -1;
            this.contractHistory.forEach((d, i) => {
                if (d.hash == item.hash) {
                    foundI = i
                    return
                }
            })
            if (foundI > -1) {
                this.contractHistory.splice(foundI, 1)
            }
            this.contractHistory.unshift(item);
            localStorage.setItem(tableName, JSON.stringify(this.contractHistory));
        } else {
            this.contractHistory.unshift(item);
            localStorage.setItem(tableName, JSON.stringify(this.contractHistory));
        }
    }

    loadContractHistory() {

        let tableName = 'contractCall' + this.getSelectedAddress();
        const local = localStorage.getItem(tableName);

        if (local) {
            this.contractHistory = [...JSON.parse(local)];
        }
    }

    cleanContractHistory() {
        let tableName = 'contractCall' + this.getSelectedAddress();
        localStorage.removeItem(tableName);
    }

    getToken(addr) {
        addr = addr + ""
        addr = addr.toLocaleLowerCase()
        return this.tokens[addr]
    }

    /**
     * setupNetwork
     * @param chainId
     * @returns {Promise<{code: *, flag: boolean}|{code: number, flag: boolean}>}
     * code:
     * -32602 not support
     * 200 switch successfully
     * 4001 switch cancelled
     * 401 no provider
     */
    async setupNetwork(chainId) {
        if ((navigator.userAgent.match(/(iPhone|iPod|Android|ios|iOS|iPad|Backerry|WebOS|Symbian|Windows Phone|Phone)/i))) {
            return {
                code: -32602,
                flag: false
            };
        }
        let provider = this.ethereum;
        if (provider) {
            if (chainId) {
                chainId = parseInt(chainId, 10)
            } else if (process.env.VUE_APP_CHAIN_ID) {
                chainId = parseInt(process.env.VUE_APP_CHAIN_ID, 10)
            } else {
                return {
                    code: 200,
                    flag: true
                }
            }
            const nodes = [CHAIN_RPC[chainId]]
            try {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: `0x${chainId.toString(16)}`,
                            chainName: CHAIN_NAME[chainId],
                            nativeCurrency: {
                                name: ChainSymbol.ZeroToken[chainId],
                                symbol: ChainSymbol.ZeroToken[chainId].toLowerCase(),
                                decimals: 18,
                            },
                            rpcUrls: nodes,
                            blockExplorerUrls: [CHAIN_BROWSER[chainId]],
                        },
                    ],
                })
                return {
                    code: 200,
                    flag: true
                }
            } catch (error) {
                // console.error('setupNetwork--->', chainId, error)
                return {
                    code: error.code,
                    flag: false
                }
            }
        } else {
            console.error('Can\'t setup the Block network on metamask because window.ethereum is undefined')
            return {
                code: 401,
                flag: false
            }
        }
    }
}

chainWeb3 = new ChainWeb3()

export default chainWeb3
