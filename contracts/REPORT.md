## Gas optimization
With some changes (up to disccuss) we can achieve 8% gas saving.

![image](https://github.com/overlay-market/merkle-airdrop/assets/46317127/82eade53-98bd-47d5-8ce2-f8d7ba252853)

### Removed `Claim` event

- **Description:** Removed `Claim` event since the transfer function already emits a `Transfer` event.

### Made `merkleRoot` private

- **Description:** Made `merkleRoot` private since it is not used outside the contract and saves gas.

### Removed token balance check in `claim` function

- **Description:** Removed token balance check in `claim` function since the transfer function already checks the balance.

### Replaced OpenZeppelin's `MerkleProof` with Solady's `MerkleProofLib`

- **Description:** Replaced OpenZeppelin's `MerkleProof` with Solady's `MerkleProofLib` to save gas.

### Refactored "merkle proof verification" logic

- **Description:** Refactored "merkle proof verification" logic to save gas by removing unnecessary variables.

## Notes

### Ownership

- **Description:** The ownable library won´t prevent to transfer the ownership to a wrong address. It is recommended to use library with two-step ownership handover.

### ERC20 zero amount transfer

- **Description:** The ERC20 standard does not prevent a zero amount transfer. Since we are using a merkle tree to distribute the tokens and then blocking the user to claim again, in case a zero amount is added to the merkle tree by mistake, the user will be blocked to claim the tokens when the merkle root is updated.
