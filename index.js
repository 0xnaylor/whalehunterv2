import { Fetcher, Token, WETH, TokenAmount, Route, Trade, TradeType, Percent } from '@uniswap/sdk';
import { ethers } from "ethers";
import { logger, extractPairAddress, initEnvironment, currencyFormatter, getCurrentEthPrice, getTokenDetails } from './utils/utils.js';
import { getPairContract, getRecipientAccount } from './utils/contracts.js'
import { buy, monitorPrice, sellTokens } from './transactions.js';
import config from './config.js'
import * as dotenv from 'dotenv'
dotenv.config()

let pairAddress, pairContract, ethUsdPrice

// WETH - UNI Ropsten V2 pool
// const url = "https://www.dextools.io/app/ether/pair-explorer/0x4E99615101cCBB83A462dC4DE2bc1362EF1365e5"
const url = "https://www.dextools.io/app/ether/pair-explorer/0x7b2A5f8956fF62b26aC87F22165F75185e2aD639"

async function main() {

  logger.info(`================ Starting Run ================`)

  const myArgs = process.argv.slice(2);  
  let provider, chainId
  
  
  // set provider and chainId
  ({ provider, chainId } = initEnvironment(myArgs));

  logger.info(`================ Pair Info ================`)

  // extract pair address from URL
  pairAddress = extractPairAddress(url)
  logger.info(`Uniswap pair address: ${pairAddress}`)

  // retrieve token addresses from pair contract token addresses
  pairContract = getPairContract(chainId, pairAddress)
  const token0Addr = await pairContract.token0()
  const token1Addr = await pairContract.token1()

  // create token contract objects from addresses and get token names and symbols
  const [ token0Name, token0Symbol, token0Decimals ] = await getTokenDetails(chainId, token0Addr);
  const [ token1Name, token1Symbol, token1Decimals ] = await getTokenDetails(chainId, token1Addr);
  
  // Now we use the pair and token information from above to create the objects we need to use the SDK
  // define Token objects for use with SDK
  const token0 = new Token(chainId, token0Addr, token0Decimals, token0Symbol, token0Name)
  const token1 = new Token(chainId, token1Addr, token1Decimals, token1Symbol, token1Name)
  let altcoin // this is coin we want to buy and sell

  if(token0.address === WETH[chainId].address) {
    altcoin = token1;
  } else if (token1.address === WETH[chainId].address) {
    altcoin = token0;
  } else {
    logger.error("exit - Needs to be a WETH pair")
    return;
  } 

  ethUsdPrice = await getCurrentEthPrice()
  const pair = await Fetcher.fetchPairData(altcoin, WETH[chainId])
  const route = new Route([pair], WETH[chainId]) // 2nd argument is the input token
  
  logger.info(`Pair: WETH/${altcoin.symbol}`)
  logger.info(`Mid price - Pre trade quote based on current pool reserves`)
  logger.info(`1 ${WETH[chainId].symbol} = ${route.midPrice.toSignificant(6)} ${altcoin.symbol}`)
  logger.info(`1 ${altcoin.symbol} = ${route.midPrice.invert().toSignificant(6)} ${WETH[chainId].symbol}`)
  logger.info(`Fiat exchange rates:`)
  logger.info(`1 ${WETH[chainId].symbol} = ${currencyFormatter.format(ethUsdPrice)}`)
  logger.info(`1 ${altcoin.symbol} = ${currencyFormatter.format(route.midPrice.invert().toSignificant(6) * ethUsdPrice)}`)
  
  // set up trade parameters
  const amountIn = ethers.utils.parseEther(config.ETH_TRADE_AMOUNT)
  const trade = new Trade(route, new TokenAmount(WETH[chainId], amountIn), TradeType.EXACT_INPUT)
  const slippageTolerance = new Percent(config.SLIPPAGE_PERCENTAGE*100, '10000')
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw
  const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
  const path = [WETH[chainId].address, altcoin.address]
  const to = getRecipientAccount(chainId).address
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 mins from current Unix time
  const tradeValue = trade.inputAmount.raw
  const tradeValueHex = ethers.BigNumber.from(tradeValue.toString()).toHexString();
  const currentGasPrice = await provider.getGasPrice()
  const txGasPrice = currentGasPrice.add(50000000000) // add 50 gwei
  const executionPrice = trade.executionPrice.invert().toSignificant(6)

  logger.info(`Execution Price: ${currencyFormatter.format(executionPrice*ethUsdPrice)} per UNI`); // uni per wrapped eth
  logger.info("Price Impact: " + trade.priceImpact.toSignificant(6) + "%");

  // execute our trade
  const tokensRecieved = await buy(txGasPrice, chainId, tradeValueHex, amountOutMinHex, path, to, deadline, altcoin, ethUsdPrice);
  await monitorPrice(executionPrice, tokensRecieved, ethUsdPrice, altcoin, chainId)
  await sellTokens()

}





main();

