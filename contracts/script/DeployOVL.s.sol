// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import {OverlayV1Token} from "src/OverlayV1Token.sol";
import {MINTER_ROLE} from "src/interfaces/IOverlayV1Token.sol";

// Deploy with:
// source .env
// forge script script/DeployOVL.s.sol:DeployOvlScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv

/* If it doesn't verify automatically, run:
forge verify-contract \
    --chain-id 421614 \
    --num-of-optimizations 200 \
    --watch \
    --etherscan-api-key <key> \
    --compiler-version v0.8.19+commit.7dd6d404 \
    <contract_address> \
    src/OverlayV1Token.sol:OverlayV1Token 
*/

contract DeployOvlScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        OverlayV1Token ovl = new OverlayV1Token();

        // Mint 100k OVL to deployer
        ovl.grantRole(MINTER_ROLE, 0xaf7F476a8C72de272Fc9A4b6153BB1B8Caa843bF);
        ovl.mint(0xaf7F476a8C72de272Fc9A4b6153BB1B8Caa843bF, 100_000 ether);

        vm.stopBroadcast();
    }
}
