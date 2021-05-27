pragma solidity 0.7.6;

contract MessengerMock {
    address constant DEFAULT_XDOMAIN_SENDER = address(0x1234);

    address public xDomainMessageSender = DEFAULT_XDOMAIN_SENDER;

    function sendMessage(
        address _target,
        bytes memory _message,
        uint32 _gasLimit
    ) external {
        xDomainMessageSender = msg.sender;
        (bool success, bytes memory res) = _target.call{gas: _gasLimit}(_message);
        xDomainMessageSender = DEFAULT_XDOMAIN_SENDER;
        require(success, string(res));
    }


    function relayMessage(
        address _target,
        address _sender,
        bytes memory _message,
        uint256
    ) external {
        xDomainMessageSender = _sender;
        (bool success, bytes memory res) = _target.call(_message);
        xDomainMessageSender = DEFAULT_XDOMAIN_SENDER;
        require(success, string(res));
    }
}
