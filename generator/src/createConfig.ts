import fs from "fs"
import csv from "csv-parser"
import { BigNumber, ethers } from "ethers"

async function main() {
    const overlayHolders: Set<string> = new Set()
    
    const ovlHolders = await getOvlHolders(Date.now() / 1000)
}

function parseCSVFile(filePath: string): Promise<Record<string, string>[]> {
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

async function getOvlHolders(upToTimestamp: number) {
    const ovlHolders: Set<string> = new Set()

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

        // address(0) will hold (-) the total supply
        balances[from] = (balances[from] ?? BigNumber.from("0")).sub(value)
        balances[to] = (balances[to] ?? BigNumber.from("0")).add(value)
    }

    console.log("OVL total supply:", balances[ethers.constants.AddressZero].abs().toString())

    // TODO: add accounts with more than 0 OVL to the `ovlHolders` set
    return ovlHolders
}

main()
