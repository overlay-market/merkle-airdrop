// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

/// ============ Imports ============

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/token/ERC20/IERC20.sol";
import {MerkleClaimERC20} from "../../MerkleClaimERC20.sol"; // MerkleClaimERC20
import {OverlayV1Token} from "../../OverlayV1Token.sol"; // OverlayV1Token
import {MerkleClaimERC20User} from "./MerkleClaimERC20User.sol"; // MerkleClaimERC20 user

/// @title MerkleClaimERC20Test
/// @notice Scaffolding for MerkleClaimERC20 tests
/// @author Anish Agnihotri <contact@anishagnihotri.com>
contract MerkleClaimERC20Test is Test {
    /// ============ Storage ============

    /// @dev MerkleClaimERC20 contract
    MerkleClaimERC20 internal TOKEN;
    /// @dev User: Alice (in merkle tree)
    MerkleClaimERC20User internal ALICE = MerkleClaimERC20User(0x185a4dc360CE69bDCceE33b3784B0282f7961aea);
    /// @dev User: Bob (not in merkle tree)
    MerkleClaimERC20User internal BOB = MerkleClaimERC20User(0xEFc56627233b02eA95bAE7e19F648d7DcD5Bb132);

    /// ============ Setup test suite ============

    function setUp() public virtual {
        address ovl = address(new OverlayV1Token());

        // Create airdrop token
        TOKEN = new MerkleClaimERC20(
            IERC20(ovl),
            // Merkle root containing ALICE with 100e18 tokens but no BOB
            0xd0aa6a4e5b4e13462921d7518eebdb7b297a7877d6cfe078b0c318827392fb55
        );

        deal(ovl, address(TOKEN), 100e18); // total amount of tokens to be claimed

        // Setup airdrop users
        ALICE = new MerkleClaimERC20User(TOKEN); // 0x185a4dc360ce69bdccee33b3784b0282f7961aea
        BOB = new MerkleClaimERC20User(TOKEN); // 0xefc56627233b02ea95bae7e19f648d7dcd5bb132

        // deployCodeTo("MerkleClaimERC20.sol", abi.encode(TOKEN), address(ALICE));
        // deployCodeTo("MerkleClaimERC20.sol", abi.encode(TOKEN), address(BOB));

        emit log_named_address("Alice", address(ALICE));
        emit log_named_address("Bob", address(BOB));
    }
}
