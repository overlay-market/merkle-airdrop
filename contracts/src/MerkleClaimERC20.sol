// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

/// ============ Imports ============

import {IERC20} from "@openzeppelin/token/ERC20/IERC20.sol";
import {MerkleProof} from "@openzeppelin/utils/cryptography/MerkleProof.sol";

/// @title MerkleClaimERC20
/// @author Anish Agnihotri <contact@anishagnihotri.com>
contract MerkleClaimERC20 {
    /// ============ Immutable storage ============

    /// @notice ERC20-claimee inclusion root
    bytes32 public immutable merkleRoot;

    /// @notice Contract address of airdropped token
    IERC20 public immutable token;

    /// ============ Mutable storage ============

    /// @notice Mapping of addresses who have claimed tokens
    mapping(address => bool) public hasClaimed;

    /// ============ Errors ============

    /// @notice Thrown if address has already claimed
    error AlreadyClaimed();

    /// @notice Thrown if address/amount are not part of Merkle tree
    error NotInMerkle();

    /// @notice Thrown if claim contract doesn't have enough tokens to payout
    error NotEnoughRewards();

    /// ============ Constructor ============

    /// @notice Creates a new MerkleClaimERC20 contract
    /// @param _token address of airdropped token
    /// @param _merkleRoot merkle root of claimees
    constructor(IERC20 _token, bytes32 _merkleRoot) {
        token = _token;
        merkleRoot = _merkleRoot;
    }

    /// ============ Events ============

    /// @notice Emitted after a successful token claim
    /// @param to recipient of claim
    /// @param amount of tokens claimed
    event Claim(address indexed to, uint256 amount);

    /// ============ Functions ============

    /// @notice Allows claiming tokens if address is part of merkle tree
    /// @param to address of claimee
    /// @param amount of tokens owed to claimee
    /// @param proof merkle proof to prove address and amount are in tree
    function claim(address to, uint256 amount, bytes32[] calldata proof) external {
        // Throw if address has already claimed tokens
        if (hasClaimed[to]) revert AlreadyClaimed();

        // Throw if the contract doesn't hold enough tokens for claimee
        if (amount > token.balanceOf(address(this))) revert NotEnoughRewards();

        // Verify merkle proof, or revert if not in tree
        bytes32 leaf = keccak256(abi.encodePacked(to, amount));
        bool isValidLeaf = MerkleProof.verifyCalldata(proof, merkleRoot, leaf);
        if (!isValidLeaf) revert NotInMerkle();

        // Set address to claimed
        hasClaimed[to] = true;

        // Award tokens to address
        token.transfer(to, amount);

        // Emit claim event
        emit Claim(to, amount);
    }
}
