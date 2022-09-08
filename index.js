import { ChainId, Fetcher, Token, WETH, Pair, TokenAmount, Route, Trade, TradeType, Percent } from '@uniswap/sdk';
import { ethers } from "ethers";
import { PROJECT_ID, MAINNET_URL, ROPSTEN_URL } from './constants.js';
import { logger } from './utils/logger.js';
import * as dotenv from 'dotenv'
dotenv.config()

async function main() {

  const myArgs = process.argv.slice(2);  
  let provider, tokenAddress, chainId
  
  ({ provider, tokenAddress, chainId } = initEnvironment(myArgs));

  const DAI = await Fetcher.fetchTokenData(chainId, tokenAddress, provider)

  console.log(`DAI Token Obj: ${JSON.stringify(DAI)}`)
  console.log(`Chain ID: ${DAI.chainId}`)
  console.log(`WETH Token Obj: ${JSON.stringify(WETH[DAI.chainId])}`)

  const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId], provider)
  console.log(JSON.stringify(pair))


  const route = new Route([pair], WETH[DAI.chainId])

  console.log(route.midPrice.toSignificant(6)) // 201.306
  console.log(route.midPrice.invert().toSignificant(6)) // 0.00496756

  const trade = new Trade(route, new TokenAmount(WETH[DAI.chainId], '1000000000000000000'), TradeType.EXACT_INPUT)
  console.log(`executionPrice: ${trade.executionPrice.toSignificant(6)}`)
  console.log(`nextMidPrice: ${trade.nextMidPrice.toSignificant(6)}`) // if trades completed before the reserves changed
  buy(trade, DAI)
}

function buy(trade, DAI){ 
  const slippageTolerance = new Percent('50', '10000') // 50 bips or 0.5%
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to hex
  const path = [WETH[DAI.chainId].address, DAI.address]
  const to = '' // should be a checksummed recipient address
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
  // The value is the amount of ETH that must be included as the msg.value in our transaction.
  const value = trade.inputAmount.raw // // needs to be converted to e.g. hex
}

function initEnvironment(myArgs) {

    let provider, tokenAddress, chainId 

    if (myArgs[0] == 'test') {
        provider = new ethers.providers.JsonRpcProvider(ROPSTEN_URL + PROJECT_ID);
        tokenAddress = "0xaD6D458402F60fD3Bd25163575031ACDce07538D";
        chainId = ChainId.ROPSTEN;
    } else if (myArgs[0] == 'main') {
        provider = new ethers.providers.JsonRpcProvider(MAINNET_URL + PROJECT_ID);
        tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
        chainId = ChainId.MAINNET;
    } else {
        provider = new ethers.providers.JsonRpcProvider(ROPSTEN_URL + PROJECT_ID);
        tokenAddress = "0xaD6D458402F60fD3Bd25163575031ACDce07538D";
        chainId = ChainId.ROPSTEN;
    }
    
    logger.info({message: `Application running on ${ethers.providers.getNetwork(chainId).name}`});
    return { provider, tokenAddress, chainId };
}

main();

