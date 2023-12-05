import axios from "axios"
import fs from "fs"

const SUBGRAPH = "https://api.thegraph.com/subgraphs/name/jiajames/dydx-mainnet"

type Deposit = {
    fromAddress: string
    blockTimestamp: string
    depositAmount: string
}

const main = async () => {
    let lastTimestamp = 0

    const deposits: Deposit[] = []
    let res: Deposit[] = []

    do {
        const query = `query GetDeposits {
            deposits(
                first: 1000
                where: {blockTimestamp_gt: ${lastTimestamp}}
                orderBy: blockTimestamp
                orderDirection: asc
            ) {
                fromAddress
                blockTimestamp
                depositAmount
            }
        }`

        const variables = {}

        res = (await axios.post(SUBGRAPH, { query, variables })).data.data
            .deposits

        deposits.push(...res)

        // Deposits are sorted by timestamp, so we can use the last timestamp to get the next 1000 deposits
        lastTimestamp = +res[res.length - 1].blockTimestamp

        // Save progress every 10k deposits
        if (deposits.length % 10_000 === 0) {
            fs.writeFileSync(
                "data/dydx.json",
                JSON.stringify(
                    {
                        lastTimestamp,
                        totalDeposits: deposits.length,
                        deposits,
                    },
                    null,
                    4
                )
            )
            console.log(
                `Saved progress at t=${lastTimestamp} and ${deposits.length} deposits`
            )
        }
    } while (res.length === 1000)

    fs.writeFileSync(
        "data/dydx.json",
        JSON.stringify(
            {
                lastTimestamp,
                totalDeposits: deposits.length,
                deposits,
            },
            null,
            4
        )
    )

    console.log("Total deposits:", deposits.length)
}

main()
