import { ChainId, Fetcher, Token, WETH, Pair, TokenAmount, Route, Trade, TradeType, Percent } from '@uniswap/sdk';
import { ethers } from "ethers";
import { PROJECT_ID, MAINNET_URL, ROPSTEN_URL } from './constants.js';
import { logger, extractPairAddress, initEnvironment, currencyFormatter, getCurrentEthPrice } from './utils/utils.js';
import { getPairContract, getERC20Contract } from './utils/contracts.js'
import * as dotenv from 'dotenv'
dotenv.config()

let pairAddress, pairContract, ethUsdPrice

// WETH - UNI Ropsten V2 pool
const url = "https://www.dextools.io/app/ether/pair-explorer/0x4E99615101cCBB83A462dC4DE2bc1362EF1365e5"

async function main() {

  logger.info(`================ Starting Run ================`)

  const myArgs = process.argv.slice(2);  
  let provider, tokenAddress, chainId
  
  // set provider and chainId
  ({ provider, tokenAddress, chainId } = initEnvironment(myArgs));

  logger.info(`================ Pair Info ================`)

  // extract pair address from URL
  pairAddress = extractPairAddress(url)
  logger.info(`Uniswap pair address: ${pairAddress}`)

  // create pair contract and retrieve token addresses
  pairContract = getPairContract(chainId, pairAddress)
  const token0Addr = await pairContract.token0()
  const token1Addr = await pairContract.token1()

  // create token contract objects from addresses and get token names and symbols.
  const token0Contract = getERC20Contract(chainId, token0Addr)
  const token0Symbol = await token0Contract.symbol()
  const token0Name = await token0Contract.name()
  const token0Decimals = await token0Contract.decimals()

  const token1Contract = getERC20Contract(chainId, token1Addr)
  const token1Symbol = await token1Contract.symbol()
  const token1Name = await token1Contract.name()
  const token1Decimals = await token1Contract.decimals()

  logger.info(`token0: ${token0Name} (${token0Symbol})`)
  logger.info(`token1: ${token1Name} (${token1Symbol})`)
  
  

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

  // create pair object for use with SDK
  const pair = await Fetcher.fetchPairData(altcoin, WETH[chainId])

  // create route
  const route = new Route([pair], WETH[chainId]) // 2nd argument is the input token
  ethUsdPrice = await getCurrentEthPrice()

  
  logger.info(`Pair: WETH/${altcoin.symbol}`)
  logger.info(`1 ${WETH[chainId].symbol} = ${route.midPrice.toSignificant(6)} ${altcoin.symbol}`)
  logger.info(`1 ${altcoin.symbol} = ${route.midPrice.invert().toSignificant(6)} ${WETH[chainId].symbol}`)
  logger.info(`Fiat exchange rates:`)
  logger.info(`1 ${altcoin.symbol} = ${currencyFormatter.format(route.midPrice.invert().toSignificant(6) * ethUsdPrice)}`)
  logger.info(`1 ${WETH[chainId].symbol} = ${currencyFormatter.format(ethUsdPrice)}`)



//   const trade = new Trade(route, new TokenAmount(WETH[DAI.chainId], '1000000000000000000'), TradeType.EXACT_INPUT)
//   console.log(`executionPrice: ${trade.executionPrice.toSignificant(6)}`)
//   console.log(`nextMidPrice: ${trade.nextMidPrice.toSignificant(6)}`) // if trades completed before the reserves changed
//   buy(trade, DAI)
}

// function buy(trade, DAI){ 
//   const slippageTolerance = new Percent('50', '10000') // 50 bips or 0.5%
//   const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to hex
//   const path = [WETH[DAI.chainId].address, DAI.address]
//   const to = '' // should be a checksummed recipient address
//   const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
//   // The value is the amount of ETH that must be included as the msg.value in our transaction.
//   const value = trade.inputAmount.raw // // needs to be converted to e.g. hex
// }

main();



