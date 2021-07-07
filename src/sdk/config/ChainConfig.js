const CHAIN_RPC = {
    1: 'https://mainnet.infura.io/v3/0e47785118b2494092b1a9a9b576c2bd',
    42: 'https://kovan.infura.io/v3/0e47785118b2494092b1a9a9b576c2bd',
    56: 'https://bsc-dataseed.binance.org',
    97: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    128: 'https://http-mainnet.hecochain.com',
    256: 'https://http-testnet.hecochain.com'
};

const CHAIN_BROWSER = {
    1: "https://etherscan.io",
    42: "https://kovan.etherscan.io",
    56: "https://bscscan.com",
    97: "https://testnet.bscscan.com",
    128: "https://hecoinfo.com",
    256: "https://testnet.hecoinfo.com"
}

const CHAIN_NAME = {
    1: "Ethereum Chain Mainnet",
    42: "Ethereum Chain Kovan",
    56: "Binance Smart Chain Mainnet",
    97: "Binance Smart Chain Testnet",
    128: "HECO Chain Mainnet",
    256: "HECO Chain Testnet"
}

const ContractsAddr = {
    1: {
        SwitchQuery: "",
        SwitchConfig: "",
        SwitchTrigger: "",
        SwitchFarm: "",
        SwitchTreasury: "",
        SwitchAcross: "",
        SwitchTicketFactory: ""
    },
    42: {
        SwitchQuery : "0x003a79E345439188780d08f14bc43E3A40565B89",
        SwitchConfig : "0x9B3329115964B163230cf1F7B723f7CE8F1C39E8",
        SwitchTrigger : "0x4aFf78CEd2335090Abadd9DfF17f7B61453eBE27",
        SwitchTreasury : "0xf5D801d5888A33999bc34eDD444b07FED7487BCa",
        SwitchSigner : "0xafbc578BD519Adb4EAd4f697726b28b86D7B4710",
        SwitchAcross : "0xe4a7C152FF78e7f779fd6E5F26fC0fe6583ffc46",
        SwitchTicketFactory : "0xB0907C33EFfDD878D890ca01201F4218EEf39D9F",
        SwitchFarm : "0x32E9B1Ff76649edDd59CdC0f600D5666D843b1DD",
    },
    56: {
        DemaxProjectQuery: '0x1a64489D69FB4C6638eae6Cb5D898296F8Db19cE',
        SwitchQuery: "",
        SwitchConfig: "",
        SwitchTrigger: "",
        SwitchFarm: "",
        SwitchTreasury: "",
        SwitchAcross: "",
        SwitchTicketFactory: ""
    },
    97: {
        SwitchQuery : "0x2bB185f00a4Be1B9cA34c958a91E382f291d00Dc",
        SwitchConfig : "0x51af34Fb98B4dfc9b80324b50f606D7737a0d5B4",
        SwitchTrigger : "0x8dda940306D5d176e512E3aC209e4881240AC626",
        SwitchTreasury : "0x3F86b12f09A14a6bD07F9e3eb5a044e9eAa13965",
        SwitchSigner : "0xb7bE63B23aB9475807a2E5CB3EE42E2c22B111c1",
        SwitchAcross : "0x6C38db27432F3CFc3A12b26334aC51dfa31c7D29",
        SwitchTicketFactory : "0xc4387F1cDD0823B0f806737d681a783dd8c6827F",
        SwitchFarm : "0xf2236646dD3BdE9a4Fe8fd108FB082f9680DA4D6",
    },
    128: {
        SwitchQuery: "",
        SwitchConfig: "",
        SwitchTrigger: "",
        SwitchFarm: "",
        SwitchTreasury: "",
        SwitchAcross: "",
        SwitchTicketFactory: ""
    },
    256: {
        SwitchQuery : "0x3602ed8Eb3ec9Bfd08b1A479cE75bBC0b8bf0223",
        SwitchConfig : "0x6A0c3A05fF4cb640B4eeA3845F976972C334287C",
        SwitchTrigger : "0x7e5d05Ceefcd26D3e3a6683AD36447C4ED45Db05",
        SwitchTreasury : "0xCb1D6D211a51af89B859ED37884df4CB5FA8e393",
        SwitchSigner : "0x4C7C782FCcC6F24C4348c03814a9A5441B968E88",
        SwitchAcross : "0xaAEF5FBA4dF2C533DD8674788647F28A385727C4",
        SwitchTicketFactory : "0x5f868Db76f02Cf0D5A7e72561c5c4b9D33A4e9eE",
        SwitchFarm : "0x3624fcd9452739F3472321877c2DeC1381c3032e",
    },
}

const Tokens = {
    56: {
        USDT: '0x55d398326f99059fF775485246999027B3197955',
        WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    },
    42: {
        WETH : "0x67fe5bE3f16c01fd5C5eb3DdCC08f1dAefac40a5",
        USDT : "0xF02D16a87F97428A258A48476b52Cfc105E371C1",
        USDC : "0x42aC2e5bD42a5Eceb72d06C9c1A5A45433c17911",
        DAI : "0x38B9eC6994F288155345cF5aC9245182eF12F04f",
    },
    97: {
        WETH : "0x7FcCaDD3e6A3F80e194CaDf13FeDF36B9BBbe98F",
        USDT : "0xF2ED382e6A3439Be124813842200cf6702fD6ecA",
        USDC : "0x716AE8720739F0434B8D469cd3EC392A0fE16599",
        DAI : "0xCB6260C77629c25A065081442EF4E2Bec297aa09",
    },
    256: {
        WETH : "0x8F8da91c632be57C62D60A27f4ed07025Dfb9580",
        USDT : "0xadCf42A9318D10F0D70333812F4A3Ab0622e0ef3",
        USDC : "0xA0993880177D3c7BB57546b0b349F93143877d19",
        DAI : "0xD512A14824D40c82582522BFE936d35354658BC5",
    },
}

const ChainSymbol = {
    WToken: {
        1: "WETH",
        42: "WETH",
        56: "WBNB",
        97: "WBNB",
        128: "WHT",
        256: "WHT"
    },
    ZeroToken: {
        1: "ETH",
        42: "ETH",
        56: "BNB",
        97: "BNB",
        128: "HT",
        256: "HT"
    }
}


const STAKINGTOKENPRE = "sw"


export { CHAIN_RPC, CHAIN_BROWSER, CHAIN_NAME, Tokens, ContractsAddr, ChainSymbol, STAKINGTOKENPRE };
