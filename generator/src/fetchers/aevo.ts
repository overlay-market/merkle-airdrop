import axios from "axios"
import fs from "fs"

// TODO: use your own API key here
const DUNE_QUERY = "https://api.dune.com/api/v1/query/2660871/results?api_key=<api_key>"

const main = async () => {
    const res = (await axios.get(DUNE_QUERY)).data

    fs.writeFileSync("data/aevo.json", JSON.stringify(res, null, 2))
}

main()
