import fs from "fs"
import csv from "csv-parser"
import { BigNumber, ethers } from "ethers"

import { MARKETS } from "./constants"

const main = async () => {
    const upToTimestamp = Date.now() / 1000

    const ovlHolders = await getOvlHolders(upToTimestamp)
    const litterboxHolders = await getNftHolders("litterbox", upToTimestamp)
    const planckcatHolders = await getNftHolders("planckcat", upToTimestamp)

    console.log("ovlHolders", ovlHolders.length)
    console.log("litterboxHolders", litterboxHolders.length)
    console.log("planckcatHolders", planckcatHolders.length)
}

const getOvlHolders = async (upToTimestamp: number) => {
    const transfers = await parseCSVFile("data/ovl_transfers.csv")

    // Sort by timestamp
    transfers.sort((a, b) => +a["UnixTimestamp"] - +b["UnixTimestamp"])

    const balances: Record<string, BigNumber> = {}

    for (const transfer of transfers) {
        if (+transfer["UnixTimestamp"] > upToTimestamp) break

        const from = transfer["From"]
        const to = transfer["To"]
        // Make sure to remove commas from the quantity (eg. 1,000 -> 1000)
        const value = ethers.utils.parseEther(transfer["Quantity"].replaceAll(",", ""))

        // Ignore market interactions
        if (!MARKETS.includes(from) && !MARKETS.includes(to)) {
            balances[from] = (balances[from] ?? BigNumber.from("0")).sub(value)
            balances[to] = (balances[to] ?? BigNumber.from("0")).add(value)
        }
    }

    const positiveBalances = Object.entries(balances).flatMap(([address, balance]) => balance.gt(0) ? [{ address, balance }] : [])

    return positiveBalances
}

const getNftHolders = async (collection: "litterbox" | "planckcat", upToTimestamp: number) => {
    const transfers = await parseCSVFile(`data/${collection}_transfers.csv`)

    // Sort by timestamp
    transfers.sort((a, b) => +a["UnixTimestamp"] - +b["UnixTimestamp"])

    const balances: Record<string, number> = {}

    for (const transfer of transfers) {
        if (+transfer["UnixTimestamp"] > upToTimestamp) break

        const from = transfer["From"]
        const to = transfer["To"]
        // ERC1155 transfers have a "Value" field, ERC721 transfers don't
        const value = +transfer["Value"] || 1

        balances[from] = (balances[from] ?? 0) - value
        balances[to] = (balances[to] ?? 0) + value
    }

    const positiveBalances = Object.entries(balances).flatMap(([address, balance]) => balance > 0 ? [{ address, balance }] : [])

    return positiveBalances
}

const parseCSVFile = (filePath: string): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
        const results: Record<string, string>[] = []

        fs.createReadStream(filePath)
            .on("error", (error: any) => {
                reject(error)
            })
            .pipe(csv())
            .on("data", (data: any) => {
                results.push(data)
            })
            .on("end", () => {
                resolve(results)
            })
    })
}

main()
