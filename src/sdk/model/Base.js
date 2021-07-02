export default class Base {
    constructor(provider, abi, address) {
        this.provider = provider;
        this.abi = abi;
        this.address = address;
        provider.registerModule(this);
    }

    initialize(chainId, account=null) {
        this.provider.chainId = chainId;
        if(account) {
            this.provider.account = account;
        }
        if(this.abi && this.address) {
            this.contract = this.provider.getContract(this.abi, this.address);
        }
    }
    
    initAfter() {

    }

    clean() {
        
    }
}
