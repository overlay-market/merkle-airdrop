// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/// ============ Imports ============

import {MerkleClaimERC20Test} from "./utils/MerkleClaimERC20Test.sol"; // Test scaffolding

/// @title Tests
/// @notice MerkleClaimERC20 tests
/// @author Anish Agnihotri <contact@anishagnihotri.com>
contract Tests is MerkleClaimERC20Test {
    /// @notice Allow Alice to claim 100e18 tokens
    function testAliceClaim() public {
        // Setup correct proof for Alice
        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = 0xceeae64152a2deaf8c661fccd5645458ba20261b16d2f6e090fe908b0ac9ca88;

        // Collect Alice balance of tokens before claim
        uint256 alicePreBalance = ALICE.tokenBalance();

        // Claim tokens
        ALICE.claim(
            // Claiming for Alice
            address(ALICE),
            // 100 tokens
            100e18,
            // With valid proof
            aliceProof
        );

        // Collect Alice balance of tokens after claim
        uint256 alicePostBalance = ALICE.tokenBalance();

        // Assert Alice balance before + 100 tokens = after balance
        assertEq(alicePostBalance, alicePreBalance + 100e18);
    }

    /// @notice Prevent Alice from claiming twice
    function testFailAliceClaimTwice() public {
        // Setup correct proof for Alice
        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = 0xceeae64152a2deaf8c661fccd5645458ba20261b16d2f6e090fe908b0ac9ca88;

        // Claim tokens
        ALICE.claim(
            // Claiming for Alice
            address(ALICE),
            // 100 tokens
            100e18,
            // With valid proof
            aliceProof
        );

        // Claim tokens again
        ALICE.claim(
            // Claiming for Alice
            address(ALICE),
            // 100 tokens
            100e18,
            // With valid proof
            aliceProof
        );
    }

    /// @notice Prevent Alice from claiming with invalid proof
    function testFailAliceClaimInvalidProof() public {
        // Setup incorrect proof for Alice
        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = 0xc11ae64152a2deaf8c661fccd5645458ba20261b16d2f6e090fe908b0ac9ca88;

        // Claim tokens
        ALICE.claim(
            // Claiming for Alice
            address(ALICE),
            // 100 tokens
            100e18,
            // With valid proof
            aliceProof
        );
    }

    /// @notice Prevent Alice from claiming with invalid amount
    function testFailAliceClaimInvalidAmount() public {
        // Setup correct proof for Alice
        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = 0xceeae64152a2deaf8c661fccd5645458ba20261b16d2f6e090fe908b0ac9ca88;

        // Claim tokens
        ALICE.claim(
            // Claiming for Alice
            address(ALICE),
            // Incorrect: 1000 tokens
            1000e18,
            // With valid proof (for 100 tokens)
            aliceProof
        );
    }

    /// @notice Prevent Bob from claiming
    function testFailBobClaim() public {
        // Setup correct proof for Alice
        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = 0xceeae64152a2deaf8c661fccd5645458ba20261b16d2f6e090fe908b0ac9ca88;

        // Claim tokens
        BOB.claim(
            // Claiming for Bob
            address(BOB),
            // 100 tokens
            100e18,
            // With valid proof (for Alice)
            aliceProof
        );
    }

    /// @notice Let Bob claim on behalf of Alice
    function testBobClaimForAlice() public {
        // Setup correct proof for Alice
        bytes32[] memory aliceProof = new bytes32[](1);
        aliceProof[0] = 0xceeae64152a2deaf8c661fccd5645458ba20261b16d2f6e090fe908b0ac9ca88;

        // Collect Alice balance of tokens before claim
        uint256 alicePreBalance = ALICE.tokenBalance();

        // Claim tokens
        BOB.claim(
            // Claiming for Alice
            address(ALICE),
            // 100 tokens
            100e18,
            // With valid proof (for Alice)
            aliceProof
        );

        // Collect Alice balance of tokens after claim
        uint256 alicePostBalance = ALICE.tokenBalance();

        // Assert Alice balance before + 100 tokens = after balance
        assertEq(alicePostBalance, alicePreBalance + 100e18);
    }

    function testAdminUpdatesMerkleRoot() public {
        bytes32 newMerkleRoot = bytes32(uint256(1));

        merkleClaim.updateMerkleRoot(newMerkleRoot);
    }

    function testUserUpdatesMerkleRoot() public {
        bytes32 newMerkleRoot = bytes32(uint256(1));

        vm.startPrank(address(BOB));

        vm.expectRevert("Ownable: caller is not the owner");
        merkleClaim.updateMerkleRoot(newMerkleRoot);
    }

    function testClaimToZeroAddress() public {
        // Create a new Merkle Tree
        bytes32 leaf_0 = keccak256(abi.encodePacked(address(0), uint256(100e18)));
        bytes32 leaf_1 = keccak256(abi.encodePacked(address(BOB), uint256(100e18)));
        bytes32 root = keccak256(abi.encodePacked(leaf_1, leaf_0));

        // Update Merkle Tree
        merkleClaim.updateMerkleRoot(root);

        // Setup correct proof for Zero Address
        bytes32[] memory zeroProof = new bytes32[](1);
        zeroProof[0] = leaf_1;

        vm.expectRevert("ERC20: transfer to the zero address");
        // Claim tokens
        BOB.claim(
            // Claiming for Zero Address
            address(0),
            // 100 tokens
            100e18,
            // With valid proof (for Zero Address)
            zeroProof
        );
    }

    function testClaimAmountZero() public {
        // Create a new Merkle Tree
        bytes32 leaf_0 = keccak256(abi.encodePacked(address(ALICE), uint256(100e18)));
        bytes32 leaf_1 = keccak256(abi.encodePacked(address(BOB), uint256(0)));
        bytes32 root = keccak256(abi.encodePacked(leaf_0, leaf_1));

        // Update Merkle Tree
        merkleClaim.updateMerkleRoot(root);

        // Setup correct proof for Zero Address
        bytes32[] memory zeroProof = new bytes32[](1);
        zeroProof[0] = leaf_0;

        // Claim tokens
        BOB.claim(
            // Claiming for BOB
            address(BOB),
            // 0 tokens
            0,
            // With valid proof (for Zero Address)
            zeroProof
        );
    }

    function testTransferOwnership() public {
        vm.startPrank(address(BOB));
        vm.expectRevert("Ownable: caller is not the owner");
        merkleClaim.transferOwnership(address(BOB));

        vm.stopPrank();
        merkleClaim.transferOwnership(address(BOB));
        vm.startPrank(address(BOB));
        merkleClaim.transferOwnership(address(BOB));

        assertEq(merkleClaim.owner(), address(BOB));
    }
}
