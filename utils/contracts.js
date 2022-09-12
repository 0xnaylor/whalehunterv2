import { ethers } from "ethers"
import config from '../config.js'
import { PROJECT_ID, MAINNET_URL, ROPSTEN_URL, UNI_V2_ROUTER_ADDR, UNI_V2_FACTORY_ADDR } from '../constants.js'
import { logger } from './utils.js'
import UniSwapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json' assert {type: "json"}
import UniswapV2ERC20 from '@uniswap/v2-core/build/UniswapV2ERC20.json' assert {type: "json"}

export function getV2Router(chainId) {

    const recipientAccount  = getRecipientAccount(chainId);
    return new ethers.Contract(
        UNI_V2_ROUTER_ADDR,
        [
            'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
            'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
        ],
        recipientAccount
    ); 
}

export function getV2Factory(chainId) {

    const recipientAccount  = getRecipientAccount(chainId);
    return new ethers.Contract(
        UNI_V2_FACTORY_ADDR,
        UniSwapV2Factory.abi,
        recipientAccount
    ); 
}

export function getPairContract(chainId, pairAddress) {

    const recipientAccount  = getRecipientAccount(chainId);
    return new ethers.Contract(
        pairAddress,
        [
          'function token0() external view returns (address)',
          'function token1() external view returns (address)',
          'function approve(address spender, uint value) external returns (bool)'
        ],
        recipientAccount
      )
}

export function getERC20Contract(chainId, tokenAddress) {

    const recipientAccount  = getRecipientAccount(chainId);
    return new ethers.Contract(
        tokenAddress,
        UniswapV2ERC20.abi,
        recipientAccount
      )
}

export function getRecipientAccount(chainId) {

    let provider, wallet

    if (chainId === 1) { // mainnet
        provider = new ethers.providers.JsonRpcProvider(MAINNET_URL + PROJECT_ID);
        wallet = new ethers.Wallet(config.MAINNET_PK, provider);
    } else if (chainId = 3) { // ropsten
        provider = new ethers.providers.JsonRpcProvider(ROPSTEN_URL + PROJECT_ID);
        wallet = new ethers.Wallet(config.ROPSTEN_PK, provider);
    } else {
        logger.error({message: `Unsupported chainId ${chainId} passed to getRouter function`})
        return
    }
    
    return wallet.connect(provider);
}


