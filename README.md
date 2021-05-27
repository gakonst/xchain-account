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
