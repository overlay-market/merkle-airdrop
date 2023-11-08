import fs from "fs"
import csv from "csv-parser"

async function main() {
    const overlayHolders: Set<string> = new Set()
    
    const litterBoxHolders = await parseCSVFile("./data/litter_box_holders.csv")
    const ovlHolders = await parseCSVFile("./data/ovl_holders.csv")
    const planckCatHolders = await parseCSVFile("./data/planckcat_holders.csv")

    litterBoxHolders.forEach((holder: string) => overlayHolders.add(holder))
    ovlHolders.forEach((holder: string) => overlayHolders.add(holder))
    planckCatHolders.forEach((holder: string) => overlayHolders.add(holder))
    
    console.log("Overlay Holders:", overlayHolders.size)

    // TODO: add overlay holders to config.json
}

function parseCSVFile(filePath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const results: string[] = []

        fs.createReadStream(filePath)
            .on("error", (error: any) => {
                reject(error)
            })
            .pipe(csv())
            .on("data", (data: any) => {
                results.push(data["HolderAddress"])
            })
            .on("end", () => {
                resolve(results)
            })
    })
}

main()
