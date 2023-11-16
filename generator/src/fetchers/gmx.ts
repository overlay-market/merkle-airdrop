import axios from "axios"
import fs from "fs"
import { ethers } from "ethers"

const SUBGRAPH_ARB = "https://api.thegraph.com/subgraphs/name/messari/gmx-arbitrum"
const SUBGRAPH_AVAX = "https://api.thegraph.com/subgraphs/name/messari/gmx-avalanche"

const main = async () => {
    let lastAddress = ethers.constants.AddressZero

    const accounts: string[] = []
    let res: string[] = []

    const subgraphs = [SUBGRAPH_ARB, SUBGRAPH_AVAX]
    let subgraphIdx = 0

    do {
        const query = `query DepositorsGte50USDC {
            accounts(
                first: 1000
                orderBy: id
                orderDirection: asc
                where: {deposits_: {amountUSD_gte: "50"}, id_gt: "${lastAddress}"}
            ) {
                id
            }
        }`
    
        const variables = {}
    
        // Only get the address of each account
        res = (await axios.post(subgraphs[subgraphIdx], { query, variables })).data.data.accounts.map((a: any) => a.id)

        accounts.push(...res)

        // Accounts are sorted by address
        lastAddress = res[res.length - 1]

        // Save progress every 10k accounts
        if (accounts.length % 10_000 === 0) {
            fs.writeFileSync("data/gmx.json", JSON.stringify({
                totalAccounts: accounts.length,
                accounts
            }, null, 0))
            console.log(`Saved progress at subgraphIdx=${subgraphIdx} and ${accounts.length} accounts`)
        }

        // Switch networks when we reach the end of the deposits on the current one
        if (res.length < 1000) {
            subgraphIdx++
            lastAddress = ethers.constants.AddressZero
        }

    } while (subgraphIdx < subgraphs.length)

    fs.writeFileSync("data/gmx.json", JSON.stringify({
        totalAccounts: accounts.length,
        accounts
    }, null, 0))

    console.log("Total accounts:", accounts.length)
}

main()
