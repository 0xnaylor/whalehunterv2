import { ChainId } from '@uniswap/sdk';
import { ethers } from "ethers";
import CoinGecko from 'coingecko-api'
import { createLogger, format, transports } from 'winston';
import { PROJECT_ID, MAINNET_URL, ROPSTEN_URL } from '../constants.js';
import { getERC20Contract } from './contracts.js';

const { combine, timestamp, label, printf } = format;
const CoinGeckoClient = new CoinGecko()

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = createLogger({
    level: 'info',
    format: combine(
        label({ label: 'whale_hunter_v2' }),
        timestamp(),
        myFormat
    ),
    // defaultMeta: { service: 'check_unicorn_balance' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new transports.File({ filename: 'logs/whale_hunter_v2.log', level: 'error' }),
        new transports.File({ filename: 'logs/whale_hunter_v2.log' }),
    ],
    exceptionHandlers: [
        new transports.File({ filename: 'logs/whale_hunter_v2_exceptions.log' })
      ]
});

export function extractPairAddress(url) {
    let re = /[0]/;
    let startIndex = url.search(re);
    return url.substring(startIndex, startIndex+42)
}

export function initEnvironment(myArgs) {

    let provider, chainId 

    if (myArgs[0] == 'test') {
        provider = new ethers.providers.JsonRpcProvider(ROPSTEN_URL + PROJECT_ID);
        chainId = ChainId.ROPSTEN;
    } else if (myArgs[0] == 'main') {
        provider = new ethers.providers.JsonRpcProvider(MAINNET_URL + PROJECT_ID);
        chainId = ChainId.MAINNET;
    } else {
        logger.info(`Error occured, check exceptions log`)
        throw new Error(`Unrecognised argument passed: ${myArgs[0]}. Available arguments are 'main' or 'test'`)
    }
    
    logger.info({message: `Application running on ${ethers.providers.getNetwork(chainId).name}`});
    return { provider, chainId };
}

export const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD'});

export async function getCurrentEthPrice() {
    const result = await CoinGeckoClient.coins.fetch('ethereum', {})
    return result.data.market_data.current_price["usd"] 
}

export async function getTokenDetails(chainId, tokenAddress) {
    const tokenContract = getERC20Contract(chainId, tokenAddress);
    const tokenSymbol = await tokenContract.symbol();
    const tokenName = await tokenContract.name();
    const tokenDecimals = await tokenContract.decimals();
    return [ tokenName, tokenSymbol, tokenDecimals ];
}

export function delay(delayInms) {
    logger.info(`Waiting ${delayInms/1000} seconds`)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(2);
      }, delayInms);
    });
  }