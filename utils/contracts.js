const { ethers } = require("ethers");
const config = require('../config').default
const { PROJECT_ID, MAINNET_URL, ROPSTEN_URL, UNI_V2_ROUTER_ADDR } = require('../constants')
const logger = require('./utils/logger.js').logger

export function getV2Router(chainId) {

    const recipientAccount  = getRecipientAccount(chainId);

    return uniV2Router = new ethers.Contract(
        UNI_V2_ROUTER_ADDR,
        [
            'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
            'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
            'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
        ],
        recipientAccount
    ); 
}

function getRecipientAccount(chainId) {

    let provider, chainId 

    if (chainId === 1) {
        provider = new ethers.providers.JsonRpcProvider(MAINNET_URL + PROJECT_ID);
        wallet = new ethers.Wallet(config.MAINNET_PK, provider);
    } else if (chainId = 3) {
        provider = new ethers.providers.JsonRpcProvider(ROPSTEN_URL + PROJECT_ID);
        wallet = new ethers.Wallet(config.ROPSTEN_PK, provider);
    } else {
        logger.error({message: `Unsupported chainId ${chainId} passed to getRouter function`})
        return
    }
    
    return wallet.connect(provider);
}


