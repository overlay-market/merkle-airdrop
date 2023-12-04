// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

/// ============ Imports ============

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {Ownable} from "openzeppelin/access/Ownable.sol";
import {MerkleProofLib} from "solady/src/utils/MerkleProofLib.sol";

/// @title MerkleClaimERC20
/// @author Anish Agnihotri <contact@anishagnihotri.com>
contract MerkleClaimERC20 is Ownable {
    /// ============ Immutable storage ============

    /// @notice Contract address of airdropped token
    IERC20 public immutable token;

    /// ============ Mutable storage ============

    /// @notice ERC20-claimee inclusion root
    bytes32 private merkleRoot;

    /// @notice Mapping of addresses who have claimed tokens
    mapping(address => bool) public hasClaimed;

    /// ============ Errors ============

    /// @notice Thrown if address has already claimed
    error AlreadyClaimed();

    /// @notice Thrown if address/amount are not part of Merkle tree
    error NotInMerkle();

    /// ============ Constructor ============

    /// @notice Creates a new MerkleClaimERC20 contract
    /// @param _token address of airdropped token
    /// @param _merkleRoot merkle root of claimees
    constructor(IERC20 _token, bytes32 _merkleRoot) {
        token = _token;
        merkleRoot = _merkleRoot;
    }

    /// ============ Functions ============

    /// @notice Allows claiming tokens if address is part of merkle tree
    /// @param to address of claimee
    /// @param amount of tokens owed to claimee
    /// @param proof merkle proof to prove address and amount are in tree
    function claim(address to, uint256 amount, bytes32[] calldata proof) external {
        // Throw if address has already claimed tokens
        if (hasClaimed[to]) revert AlreadyClaimed();

        // Verify merkle proof, or revert if not in tree
        if (!MerkleProofLib.verifyCalldata(proof, merkleRoot, keccak256(abi.encodePacked(to, amount)))) {
            revert NotInMerkle();
        }

        // Set address to claimed
        hasClaimed[to] = true;

        // Award tokens to address
        token.transfer(to, amount);
    }

    /// @notice Allows owner to update merkle root
    /// @param _merkleRoot new merkle root
    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }
}
