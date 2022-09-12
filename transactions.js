import { getV2Router } from './utils/contracts.js'
import { logger } from './utils/utils.js';

import config from './config.js'

export async function buy(txGasPrice, chainId, tradeValueHex, amountOutMinHex, path, to, deadline) {
    if (txGasPrice <= config.GAS_PRICE_LIMIT) {
      const router = getV2Router(chainId);
      const options = { gasPrice: txGasPrice, gasLimit: config.GAS_LIMIT, value: tradeValueHex };
      const tx = await router.swapExactETHForTokens(amountOutMinHex, path, to, deadline, options);
      logger.info(`Buy transaction submitted with hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`receipt: ${JSON.stringify(receipt)}`);
    }
  }