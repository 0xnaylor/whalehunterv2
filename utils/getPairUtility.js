import { getV2Factory } from "./contracts.js";

async function main () {
    const chainId = 3
    const factory = getV2Factory(chainId)
    const tokenB = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
    const tokenA = "0xc778417E063141139Fce010982780140Aa0cD5Ab"
    const pairAddress = await factory.getPair(tokenA, tokenB)

    console.log(`Pair Address: ${pairAddress}`)
}

main()