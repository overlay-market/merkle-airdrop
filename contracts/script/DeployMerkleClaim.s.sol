// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {MerkleClaimERC20} from "src/MerkleClaimERC20.sol";

// Deploy with:
// source .env
// forge script script/DeployMerkleClaim.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        IERC20 ovl = IERC20(0x088feB3063d118c037ecAc999AD53Ec532780614);
        bytes32 merkleRoot = 0x0e4db3677f424b884357f6f95d4a5e2273e600875b8599841fcfe68539080562;

        new MerkleClaimERC20(ovl, merkleRoot);

        vm.stopBroadcast();
    }
}
