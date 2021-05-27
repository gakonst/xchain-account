pragma solidity 0.7.6;

interface Messenger {
    function sendMessage(address target, bytes memory data) external;
    function xDomainMessageSender() external view returns (address);
}

// L2 Contract which receives messages from a specific L1 address and transparently
// forwards them to the destination.
// 
// Any other L2 contract which uses this contract's address as a privileged position,
// can be considered to be owned by the `l1Owner`
contract CrossChainAccount {
    Messenger messenger;
    address l1Owner;

    constructor(Messenger _messenger, address _l1Owner) {
        messenger = _messenger;
        l1Owner = _l1Owner;
    }

    function send(address target, bytes memory data) external {
        // 1. The call MUST come from the L1 Messenger
        require(msg.sender == address(messenger), "Sender is not the messenger");
        // 2. The L1 Messenger's caller MUST be the L1 Owner
        require(messenger.xDomainMessageSender() == l1Owner, "L1Sender is not the L1Owner");
        // 3. Make the external call
        (bool success, bytes memory res) = target.call(data);
        require(success, string(abi.encode("XChain call failed:", res)));
    }

    // Any L1Contract that wants to call an L2 contract will do:
    // 1. Call the L1->L2 messenger with `target` = `address(L1Account)` and `data` =
    // abi encoding of forward(target,data)
    function forward(address target, bytes memory data) external {
        // 1. The call MUST come from the L1 Messenger
        require(msg.sender == address(messenger), "Sender is not the messenger");
        // 2. The L1 Messenger's caller MUST be the L1 Owner
        require(messenger.xDomainMessageSender() == l1Owner, "L1Sender is not the L1Owner");
        // 3. Make the external call
        (bool success, bytes memory res) = target.call(data);
        require(success, string(abi.encode("XChain call failed:", res)));
    }
}
