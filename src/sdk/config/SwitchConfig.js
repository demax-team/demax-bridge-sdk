
var SwitchPools = {
    main: {
        USDT: {
            opened: false,
            isTicket: false,
            list: [
                {
                    name: "USDT",
                    tokenAddress: "",
                    chainId: 1
                },
                {
                    name: "USDT",
                    tokenAddress: "",
                    chainId: 56
                },
                {
                    name: "USDT",
                    tokenAddress: "",
                    chainId: 189
                }
            ]
        },
        USDC: {
            opened: false,
            isTicket: false,
            list: [
                {
                    name: "USDC",
                    tokenAddress: "",
                    chainId: 1
                },
                {
                    name: "USDC",
                    tokenAddress: "",
                    chainId: 56
                },
                {
                    name: "USDC",
                    tokenAddress: "",
                    chainId: 189
                }
            ]
        },
        DAI: {
            opened: false,
            isTicket: false,
            list: [
                {
                    name: "DAI",
                    tokenAddress: "",
                    chainId: 1
                },
                {
                    name: "DAI",
                    tokenAddress: "",
                    chainId: 56
                },
                {
                    name: "DAI",
                    tokenAddress: "",
                    chainId: 189
                }
            ]
        }
    },
    test: {
        USDT: {
            opened: true,
            isTicket: false,
            list: [
                {
                    name: "USDT",
                    tokenAddress: "0xF02D16a87F97428A258A48476b52Cfc105E371C1",
                    chainId: 42
                },
                {
                    name: "USDT",
                    tokenAddress: "0xF2ED382e6A3439Be124813842200cf6702fD6ecA",
                    chainId: 97
                },
                {
                    name: "USDT",
                    tokenAddress: "0xadCf42A9318D10F0D70333812F4A3Ab0622e0ef3",
                    chainId: 256
                }
            ]
        },
        USDC: {
            opened: true,
            isTicket: false,
            list: [
                {
                    name: "USDC",
                    tokenAddress: "0x42aC2e5bD42a5Eceb72d06C9c1A5A45433c17911",
                    chainId: 42
                },
                {
                    name: "USDC",
                    tokenAddress: "0x716AE8720739F0434B8D469cd3EC392A0fE16599",
                    chainId: 97
                },
                {
                    name: "USDC",
                    tokenAddress: "0xA0993880177D3c7BB57546b0b349F93143877d19",
                    chainId: 256
                }
            ]
        },
        DAI: {
            opened: true,
            isTicket: false,
            list: [
                {
                    name: "DAI",
                    tokenAddress: "0x38B9eC6994F288155345cF5aC9245182eF12F04f",
                    chainId: 42
                },
                {
                    name: "DAI",
                    tokenAddress: "0xCB6260C77629c25A065081442EF4E2Bec297aa09",
                    chainId: 97
                },
                {
                    name: "DAI",
                    tokenAddress: "0xD512A14824D40c82582522BFE936d35354658BC5",
                    chainId: 256
                }
            ]
        },
        BTC: {
            opened: true,
            isTicket: false,
            list: [
                {
                    name: "BTC",
                    tokenSymbol: "WBTC",
                    tokenAddress: "0x08717B6Ac9D0Ff71BF51cDdEBFCe4b2Fd52e448a",
                    chainId: 42
                },
                {
                    name: "BTC",
                    tokenSymbol: "BTCB",
                    tokenAddress: "0x737AD9985898a6aBCD87CC1F861D0769AD6EEf33",
                    chainId: 97
                },
                {
                    name: "BTC",
                    tokenSymbol: "HBTC",
                    tokenAddress: "",
                    chainId: 256
                }
            ]
        },
        swUSDT: {
            opened: true,
            isTicket: true,
            list: [
                {
                    name: "swUSDT",
                    tokenAddress: "0x98B62924475c13cF60017ea5ccf029b15CfBdAb3",
                    chainId: 42
                },
                {
                    name: "swUSDT",
                    tokenAddress: "0x0EaBCf2EBbb06B0fa88564822BD9171E5ec13eb6",
                    chainId: 97
                },
                {
                    name: "swUSDT",
                    tokenAddress: "0x09191DC2677cCB7937AA89241Ff2f6BBe93D5C1c",
                    chainId: 256
                }
            ]
        },
        swUSDC: {
            opened: true,
            isTicket: true,
            list: [
                {
                    name: "swUSDC",
                    tokenAddress: "0xC6fD96088F04483E310b83550e8eabb11feF1326",
                    chainId: 42
                },
                {
                    name: "swUSDC",
                    tokenAddress: "0x393ad6d183AABA07dBbdf0c870c38EcceeEEf35f",
                    chainId: 97
                },
                {
                    name: "swUSDC",
                    tokenAddress: "0xc5E6e58e3B5816C985B19415B9b4D20F2e9Ae634",
                    chainId: 256
                }
            ]
        },
        swDAI: {
            opened: true,
            isTicket: true,
            list: [
                {
                    name: "swDAI",
                    tokenAddress: "0xa54d64A13bCB8bF7dd8488070fF34E71538cd487",
                    chainId: 42
                },
                {
                    name: "swDAI",
                    tokenAddress: "0x483d4A0DCB015c9aB55649939b7fCd612c65F868",
                    chainId: 97
                },
                {
                    name: "swDAI",
                    tokenAddress: "0x5bdC9F9c0D070A3a647EF0FAAE6BA3b9c920CB46",
                    chainId: 256
                }
            ]
        },
    },
}

const SwitchChainIds = {
    main: [1,56,128],
    test: [42,97,256],
}

var SwitchFarms = {
    main: [],
    test: [
        {
            name: "swUSDT",
            pid: 1,
            chainId:42
        },
        {
            name: "swUSDC",
            pid: 0,
            chainId:42
        },
        {
            name: "swDAI",
            pid: 2,
            chainId:42
        },
        {
            name: "swUSDT",
            pid: 0,
            chainId:97
        },
        {
            name: "swUSDC",
            pid: 1,
            chainId:97
        },
        {
            name: "swDAI",
            pid: 2,
            chainId:97
        },
        {
            name: "swUSDT",
            pid: 0,
            chainId:256
        },
        {
            name: "swUSDC",
            pid: 2,
            chainId:256
        },
        {
            name: "swDAI",
            pid: 1,
            chainId:256
        },
    ]
}

export { SwitchPools, SwitchChainIds, SwitchFarms };
