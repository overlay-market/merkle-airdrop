import axios from "axios"
import fs from "fs"
import { ethers } from "ethers"

// Optimism
const SUBGRAPH =
    "https://api.thegraph.com/subgraphs/name/fritzschoff/perps-dashboard"

const main = async () => {
    let lastAddress = ethers.constants.AddressZero

    const accounts: string[] = []
    let res: string[] = []

    do {
        const query = `query GetTradersGte50USD {
            traders(
                first: 1000
                where: {totalVolume_gte: "50000000000000000000", id_gt: "${lastAddress}"}
                orderBy: id
                orderDirection: asc
            ) {
                id
            }
        }`

        const variables = {}

        // Only get the address of each account
        res = (
            await axios.post(SUBGRAPH, { query, variables })
        ).data.data.traders.map((t: any) => t.id)

        accounts.push(...res)

        // Accounts are sorted by address
        lastAddress = res[res.length - 1]

        // Save progress every 10k accounts
        if (accounts.length % 10_000 === 0) {
            fs.writeFileSync(
                "data/synthetix.json",
                JSON.stringify(
                    {
                        totalAccounts: accounts.length,
                        accounts,
                    },
                    null,
                    0
                )
            )
            console.log(`Saved progress at ${accounts.length} accounts`)
        }
    } while (res.length === 1000)

    fs.writeFileSync(
        "data/synthetix.json",
        JSON.stringify(
            {
                totalAccounts: accounts.length,
                accounts,
            },
            null,
            0
        )
    )

    console.log("Total accounts:", accounts.length)
}

main()
