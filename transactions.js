import { ethers } from "ethers";
import { Fetcher, Token, WETH, TokenAmount, Route, Trade, TradeType, Percent } from '@uniswap/sdk';
import { getV2Router } from './utils/contracts.js'
import { logger, currencyFormatter, delay } from './utils/utils.js';
import config from './config.js'

const swapEventHash = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'

export async function buy(txGasPrice, chainId, tradeValueHex, amountOutMinHex, path, to, deadline, altcoin, ethUsdPrice) {
    if (txGasPrice <= config.GAS_PRICE_LIMIT) {
      const router = getV2Router(chainId);
      const options = { gasPrice: txGasPrice, gasLimit: config.GAS_LIMIT, value: tradeValueHex };
      const tx = await router.swapExactETHForTokens(amountOutMinHex, path, to, deadline, options);
      logger.info(`================ Initiate Buy ================`)
      logger.info(`Buy transaction submitted with hash: ${tx.hash}`);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        logger.info(`Buy transaction succeeded`)

        const logs = receipt.logs
        let swapData

        // loop through the logs and find the swap event
        for(let i = 0; i < logs.length ; i++) {
          const topic = logs[i]["topics"]
          if(topic[0] == swapEventHash) {
            swapData = ethers.utils.defaultAbiCoder.decode(
              ['uint256', 'uint256', 'uint256', 'uint256'], logs[i]["data"]
            )
          } 
        }

        // swap data contains 4 indexes [amount0In, amount1In, amount0Out, amount1Out]
        // we want to find which of the inputs have values
        const ethSpent = (swapData[0] == 0) ? swapData[1] : swapData[0]
        const tokensRecieved = (swapData[2] == 0) ? swapData[3] : swapData[2]

        logger.info(`ETH Spent: ${ethSpent*10e-19}`) 
        logger.info(`Fiat spent: $${currencyFormatter.format((ethSpent*10e-19)*ethUsdPrice)}`)
        logger.info(`${altcoin.symbol} Tokens Recieved: ${tokensRecieved*10e-19}`)

        return tokensRecieved

      } else {
        logger.error(`Buy transaction failed`)
      }
      
    }
  }

  export async function monitorPrice(executionPrice, tokensRecieved, ethUsdPrice, altcoin, chainId) {

    const amountIn = tokensRecieved
    let lastExecutionPrice = parseFloat(executionPrice)
    let count = 1
    
    logger.info(`================ Monitoring Price ================`)
    logger.info(`Original Execution Price: ${lastExecutionPrice} ETH (${currencyFormatter.format(lastExecutionPrice*ethUsdPrice)}) for 1 ${altcoin.symbol}`)
    let stoploss = lastExecutionPrice*config.STOPLOSS
    logger.info(`Stoploss (${config.STOPLOSS}%) set at: ${stoploss} ETH (${currencyFormatter.format(stoploss*ethUsdPrice)})`)
    
    while(true) {
      logger.info(`================ Check ${count} ================`)
      
      // define a trade object
      const pair = await Fetcher.fetchPairData(WETH[chainId], altcoin)
      const route = new Route([pair], altcoin) // 2nd argument is the input token
      const trade = new Trade(route, new TokenAmount(altcoin, amountIn), TradeType.EXACT_INPUT)
      let currentExecutionPrice = parseFloat(trade.executionPrice.toSignificant(6))

      if (currentExecutionPrice === lastExecutionPrice) {
        // price has not moved so do nothing
        logger.info(`Price has not moved: last execution price = ${lastExecutionPrice}, current execution price = ${currentExecutionPrice}, stoploss = ${stoploss} `)
      } else if (currentExecutionPrice < lastExecutionPrice && currentExecutionPrice > stoploss) {
        // price has dropped but not below stoploss
        logger.info(`Current Execution price: ${currentExecutionPrice} ETH (${currencyFormatter.format(currentExecutionPrice*ethUsdPrice)}), stoploss = ${stoploss}`)
        lastExecutionPrice = currentExecutionPrice
      } else if (currentExecutionPrice > lastExecutionPrice) {
        // price has increased so move the stoploss up
        logger.info(`lastExecutionPrice: ${lastExecutionPrice} typeof ${typeof lastExecutionPrice}`)
        logger.info(`currentExecutionPrice: ${currentExecutionPrice} typeof ${typeof currentExecutionPrice}`)
        stoploss = currentExecutionPrice*config.STOPLOSS
        logger.info(`Price has increased. Moving stoploss up: current execution price = ${currentExecutionPrice}, new stoploss = ${stoploss} `)
        lastExecutionPrice = currentExecutionPrice
      } else if (currentExecutionPrice <= stoploss) {
        // initiate sell
        logger.info(`Stoploss triggered: stoploss = ${stoploss}, current price = ${currentExecutionPrice} `)
        return
      } 

      count++
      await delay(config.PRICE_CHECK_INTERVAL)
    }
    



    // Todo

    // set a stop loss at 85% of the buy price
    // check the price of the token every 5 seconds
    // if the price of the token has increased set a new stop loss at 85% of the new price
    // if the token value has decreased do nothing - unless it falls below the stop loss, in that case we initiate a sell
  }

  export async function sellTokens() {
    logger.info(`Time to sell`)
  }