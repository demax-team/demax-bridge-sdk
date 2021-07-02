export default class BaseByName {
    constructor(provider, abi, name) {
        this.provider = provider;
        this.abi = abi;
        this.address = '';
        this.name = name;
        provider.registerModule(this);
    }

    initialize(chainId, account=null) {
        this.provider.chainId = chainId;
        if(account) {
            this.provider.account = account;
        }
        this.address = this.provider.getContractAddr(this.name);
        if(this.abi && this.address) {
            this.contract = this.provider.getContract(this.abi, this.address);
        }
    }

    initAfter() {

    }

    clean() {
        
    }
}
