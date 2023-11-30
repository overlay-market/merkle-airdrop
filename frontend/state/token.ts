import config from "config"; // Airdrop config
import { eth } from "state/eth"; // ETH state provider
import { ethers } from "ethers"; // Ethers
import keccak256 from "keccak256"; // Keccak256 hashing
import MerkleTree from "merkletreejs"; // MerkleTree.js
import { useEffect, useState } from "react"; // React
import { createContainer } from "unstated-next"; // State management

/**
 * Generate Merkle Tree leaf from address and value
 * @param {string} address of airdrop claimee
 * @param {string} value of airdrop tokens to claimee
 * @returns {Buffer} Merkle Tree node
 */
function generateLeaf(address: string, value: string): Buffer {
  return Buffer.from(
    // Hash in appropriate Merkle format
    ethers.utils
      .solidityKeccak256(["address", "uint256"], [address, value])
      .slice(2),
    "hex"
  );
}
[0xb70f72ad2568014b7e8950767cb2c100335d9d1832e35ee6e69c32bfc76ab94f,0x0f93af07877ce05fa024464865ff4f62801df305f1f290f912d3cab86d3a1d0f,0x0b639ce32a9ccdbb3d4dd64b8b39da118e1e3158a47d3a877b1dfdddec6a864e,0x1026155d95e8715194da3a076dfd8146b394ea8b0f823896b7eea1e0ec72d9de,0xe7589e5c2ea51d4f4a3da14a220856fc6305849e3a5e60eb1f545464c653ecd4,0x5ec830bd396e0eb89cc96a67cd1a5bb971043b6196cce044e70b3be10e7f90fc,0x54a84e362d3f1994b806cefe27bb5f82baa818967b1cf561a20bacba2b4ae558,0x34adc1dea903c5e9402139b9a3fabcb75a02004d371f350f379f331745d19366,0xeb3fa1357b160ead207ffe820029b4c46b7f629dc46a7102b9828d93ecee0f0b,0xe7224934dc5ec675182b52f6efd0615d0a1955ed65f2e320a5dd1f67986b2918,0xc0bc306ad4f0c700029dd02be1a7b22072dfa2f3203d71b8ad35922de9d120c3,0x28e67b43aaf2702ee521a2258b5e751fd91dcfed2ec62ca7e51827a607115ebd,0x4893eec1fbce543d94d1d006c6f3ee4f7b4f2259f5dd039a61abd07269d8974e,0x10ee1cd398d1341b44cfb475cff5f9a98988343853e00c275167ff9f365805bb,0x79b250cc9332e9aebe4dbb1a40a468489621d1615caa6f5e046675641985d857,0x1223e554c0df0c5feacec6a46945745ca496cf76410f82db1519c0ee674c1533,0x1c6cebc49a25f3d40fc053acaf4f8e6db978e6131f3db4f0b1ff1a3bd2b98060,0x83520117bc585d8cb32a11c17d0496a6276d23becdd5ceacd0c6a96a2dae5874,0x93a84db3c67c9a55dae48ceca522015c557218ca43e831ac63ed7e73c9b2ba8f]
// Setup merkle tree
const merkleTree = new MerkleTree(
  // Generate leafs
  Object.entries(config.airdrop).map(([address, tokens]) =>
    generateLeaf(
      ethers.utils.getAddress(address),
      ethers.utils.parseUnits(tokens.toString(), config.decimals).toString()
    )
  ),
  // Hashing function
  keccak256,
  { sortPairs: true }
);

function useToken() {
  // Collect global ETH state
  const {
    address,
    provider,
  }: {
    address: string | null;
    provider: ethers.providers.Web3Provider | null;
  } = eth.useContainer();

  // Local state
  const [dataLoading, setDataLoading] = useState<boolean>(true); // Data retrieval status
  const [numTokens, setNumTokens] = useState<number>(0); // Number of claimable tokens
  const [alreadyClaimed, setAlreadyClaimed] = useState<boolean>(false); // Claim status

  /**
   * Get contract
   * @returns {ethers.Contract} signer-initialized contract
   */
  const getContract = (): ethers.Contract => {
    return new ethers.Contract(
      // Contract address
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "",
      [
        // hasClaimed mapping
        "function hasClaimed(address) public view returns (bool)",
        // Claim function
        "function claim(address to, uint256 amount, bytes32[] calldata proof) external",
      ],
      // Get signer from authed provider
      provider?.getSigner()
    );
  };

  /**
   * Collects number of tokens claimable by a user from Merkle tree
   * @param {string} address to check
   * @returns {number} of tokens claimable
   */
  const getAirdropAmount = (address: string): number => {
    // If address is in airdrop. convert address to correct checksum
    // address = ethers.utils.getAddress(address)
    console.log({address})
    if (address in config.airdrop) {
      // Return number of tokens available
      return config.airdrop[address];
    }

    // Else, return 0 tokens
    return 0;
  };

  /**
   * Collects claim status for an address
   * @param {string} address to check
   * @returns {Promise<boolean>} true if already claimed, false if available
   */
  const getClaimedStatus = async (address: string): Promise<boolean> => {
    // Collect token contract
    const token: ethers.Contract = getContract();
    // Return claimed status
    return await token.hasClaimed(address);
  };

  const claimAirdrop = async (): Promise<void> => {
    // If not authenticated throw
    if (!address) {
      throw new Error("Not Authenticated");
    }

    // Collect token contract
    const token: ethers.Contract = getContract();
    // Get properly formatted address
    const formattedAddress: string = ethers.utils.getAddress(address);
    // Get tokens for address
    const numTokens: string = ethers.utils
      .parseUnits(config.airdrop[address].toString(), config.decimals)
      .toString();

    // Generate hashed leaf from address
    const leaf: Buffer = generateLeaf(formattedAddress, numTokens);
    // Generate airdrop proof
    const proof: string[] = merkleTree.getHexProof(leaf);
    console.log({proof})

    // Try to claim airdrop and refresh sync status
    try {
      const tx = await token.claim(formattedAddress, numTokens, proof);
      await tx.wait(1);
      await syncStatus();
    } catch (e) {
      console.error(`Error when claiming tokens: ${e}`);
    }
  };

  /**
   * After authentication, update number of tokens to claim + claim status
   */
  const syncStatus = async (): Promise<void> => {
    // Toggle loading
    setDataLoading(true);

    // Force authentication
    if (address) {
      console.log({address})
      // Collect number of tokens for address
      const tokens = getAirdropAmount(address);
      setNumTokens(tokens);

      // Collect claimed status for address, if part of airdrop (tokens > 0)
      if (tokens > 0) {
        const claimed = await getClaimedStatus(address);
        setAlreadyClaimed(claimed);
      }
    }

    // Toggle loading
    setDataLoading(false);
  };

  // On load:
  useEffect(() => {
    syncStatus();
  }, [address]);

  return {
    dataLoading,
    numTokens,
    alreadyClaimed,
    claimAirdrop,
  };
}

// Create unstated-next container
export const token = createContainer(useToken);
