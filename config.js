import * as dotenv from 'dotenv'
dotenv.config()

const config = {
    ETH_TRADE_AMOUNT: '0.001',
    GAS_PRICE_LIMIT: 125000000000, // 125 gwei
    SLIPPAGE_PERCENTAGE: '22',
    GAS_LIMIT: 500000,
    STOPLOSS: 15,
    PRICE_CHECK_INTERVAL: 1000 * 5, // 5 seconds
    ROPSTEN_PK: process.env['ROPSTEN_PK'],
    MAINNET_PK: process.env['MAINNET_PK'],
}

export default config