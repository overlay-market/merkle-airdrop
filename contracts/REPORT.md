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
