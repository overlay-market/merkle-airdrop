import fs from "fs"
import csv from "csv-parser"
import { BigNumber, ethers } from "ethers"
import { parseEther, parseUnits } from "ethers/lib/utils"

const main = async () => {
    const upToTimestamp = Date.now() / 1000

    // ----- Overlay -----
    const ovlHolders = await getOvlHolders(upToTimestamp)
    const litterboxHolders = await getNftHolders("litterbox", upToTimestamp)
    const planckcatHolders = await getNftHolders("planckcat", upToTimestamp)

    console.log("ovlHolders", ovlHolders.length)
    console.log("litterboxHolders", litterboxHolders.length)
    console.log("planckcatHolders", planckcatHolders.length)

    // ----- dYdX -----
    const dydxDepositors = getDydxDepositors(upToTimestamp)

    console.log("dydxDepositors", dydxDepositors.length)

    // ----- GMX -----
    const gmxDepositors = getGmxDepositors() // data up to Nov 15th 2023

    console.log("gmxDepositors", gmxDepositors.length)

    // ----- Aevo -----
    const aevoDepositors = getAevoDepositors() // data up October 2023

    console.log("aevoDepositors", aevoDepositors.length)

    // ----- Synthetix -----
    const synthetixDepositors = getSynthetixDepositors() // data up to Nov 16th 2023

    console.log("synthetixDepositors", synthetixDepositors.length)

    // ----- DegenScore -----
    const degenScoreHolders = await getDegenScoreHolders() // data up to Nov 20th 2023

    console.log("degenScoreHolders", degenScoreHolders.length)
}

const getDegenScoreHolders = async () => {
    const holders = await parseCSVFile("data/degenscore_holders.csv")

    const balances: Record<string, number> = {}

    for (const holder of holders) {
        const address = holder["HolderAddress"]
        const balance = +holder["Unique Tokens"]

        balances[address] = (balances[address] ?? 0) + balance
    }

    return Object.entries(balances).map(([address, balance]) => ({ address, balance }))
}

const getSynthetixDepositors = () => {
    const moreThan50UsdDepositors = JSON.parse(fs.readFileSync("data/synthetix.json", "utf8")).accounts
    return moreThan50UsdDepositors
}

const getAevoDepositors = (): string[] => {
    const txs = JSON.parse(fs.readFileSync("data/aevo.json", "utf8")).result.rows
    const depositsHigherThan50Usd = txs.filter((tx: any) => tx.action === "deposit" && tx.usd >= 50)
    return depositsHigherThan50Usd.map((tx: any) => tx.user)
}

const getGmxDepositors = () => {
    const moreThan50UsdcDepositors = JSON.parse(fs.readFileSync("data/gmx.json", "utf8")).accounts
    return moreThan50UsdcDepositors
}

const getDydxDepositors = (upToTimestamp: number) => {
    // These are already sorted by timestamp
    const deposits = JSON.parse(fs.readFileSync("data/dydx.json", "utf8")).deposits

    const balances: Record<string, BigNumber> = {}

    for (const deposit of deposits) {
        if (+deposit.blockTimestamp > upToTimestamp) break

        const address = deposit.fromAddress
        const value = BigNumber.from(deposit.depositAmount)

        balances[address] = (balances[address] ?? BigNumber.from("0")).add(value)
    }

    const moreThan50UsdcDepositors = Object.entries(balances).flatMap(([address, balance]) =>
        balance.gt(parseUnits("50", 6)) ? [{ address, balance }] : [] // mainnet USDC has 6 decimals
    )

    return moreThan50UsdcDepositors
}

const getOvlHolders = async (upToTimestamp: number) => {
    const transfers = await parseCSVFile("data/ovl_transfers.csv")
    const marketBuilds = JSON.parse(fs.readFileSync("data/builds.json", "utf8")).data.builds
    const marketUnwinds = JSON.parse(fs.readFileSync("data/unwinds.json", "utf8")).data.unwinds

    // Sort by timestamp
    transfers.sort((a, b) => +a["UnixTimestamp"] - +b["UnixTimestamp"])
    marketBuilds.sort((a: any, b: any) => +a.timestamp - +b.timestamp)
    marketUnwinds.sort((a: any, b: any) => +a.timestamp - +b.timestamp)

    const balances: Record<string, BigNumber> = {}

    // Go through all OVL transfers and track balances for each user
    for (const transfer of transfers) {
        if (+transfer["UnixTimestamp"] > upToTimestamp) break

        const from = transfer["From"]
        const to = transfer["To"]
        // Make sure to remove commas from the quantity (eg. 1,000 -> 1000)
        const value = parseEther(transfer["Quantity"].replaceAll(",", ""))

        balances[from] = (balances[from] ?? BigNumber.from("0")).sub(value)
        balances[to] = (balances[to] ?? BigNumber.from("0")).add(value)
    }

    const openPositions: Record<string, Record<string, {fraction: BigNumber, collateral: BigNumber}>> = {}
    const initialFraction = parseEther("1000000000000000000")

    // Track all open positions
    for (const {position, timestamp, owner} of marketBuilds) {
        if (+timestamp > upToTimestamp) break

        const collateral = parseEther(position.initialCollateral.replaceAll(",", ""))
        const positionId = position.market.id + position.positionId

        openPositions[owner.id] = openPositions[owner.id] ?? {}
        openPositions[owner.id][positionId] = { collateral, fraction: initialFraction }
    }

    // Remove fraction of position from open positions
    for (const {position, timestamp, owner, fractionOfPosition} of marketUnwinds) {
        if (+timestamp > upToTimestamp) break

        const positionId = position.market.id + position.positionId
        
        openPositions[owner.id][positionId].fraction = openPositions[owner.id][positionId].fraction.sub(parseEther(fractionOfPosition))
    }

    // Add collateral locked in an open position to user's balance
    for (const [owner, positions] of Object.entries(openPositions)) {
        for (const {collateral, fraction} of Object.values(positions)) {
            const balance = fraction.mul(collateral).div(initialFraction).div(ethers.constants.WeiPerEther)
            balances[owner] = (balances[owner] ?? BigNumber.from("0")).add(balance)
        }
    }

    // Keep only users with balance > 0
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
