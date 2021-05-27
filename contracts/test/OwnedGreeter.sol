pragma solidity 0.7.6;

contract OwnedGreeter {
    address owner;
    string public greeting = "hi";

    constructor(address _owner) {
        owner = _owner;
    }

    function setGreeting(string memory _greeting) public {
        require(msg.sender == owner, "not owner");
        greeting = _greeting;
    }
}
