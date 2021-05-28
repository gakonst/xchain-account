# Cross Chain Acccount

This is a simple contract implementation for issuing commands to L2 contracts
from L1 addresses. Optimism does not natively allow using `msg.sender` to get the L1
address, so we use a contract which checks that `xDomainMsgSender` is the expected l1 owner.

## Test

```
yarn
# evm tests
yarn hardhat test
# ovm tests
yarn optimism:up && yarn test
```

## Deploy an account

```
L1_OWNER=<the L2 contract's L1 owner> yarn hardhat run scripts/deploy.ts --network optimism
```

## Submit an autonomous governance proposal

```
# Add this if you want to run an interration test against a local hardhat environment
# TESTING=1
# Your node's URL
URL="http://localhost:9545" \
# The L2 contract you want to call from L1
L2_TARGET="0x902e5fF5A99C4eC1C21bbab089fdabE32EF0A5DF" \
# The function you want to call on L2 from L1
FUNCTION="function set(uint256)" \
# The arguments to that function
ARGS="1234" \
# The L2 Account owned by the L1 Governance which will execute the call to the L2 contract
L2_ACCOUNT="0x902e5fF5A99C4eC1C21bbab089fdabE32EF0A5DF" \
# Your governance proposal's description
DESCRIPTION="My description"
yarn ts-node ./scripts/createVote.ts
```
