import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('CrossChainAccount', () => {
  it("forwards messages to target contract (unit test)", async () => {
    const [signer] = await ethers.getSigners()
    const greeting = "haha"

    // 1. Deploy the Messenger
    const messenger = await (await ethers.getContractFactory("MessengerMock")).deploy()

    // 2. Deploy the L2 account
    const l2acc = await (
      await ethers.getContractFactory("CrossChainAccount")
    ).deploy(messenger.address, await signer.getAddress())

    // 3. Deploy the Test onlyOwner contract
    const greeter = await (
      await ethers.getContractFactory("OwnedGreeter")
    ).deploy(l2acc.address)

    const args = [
      // This would be set to the L2 receiving contract address
      greeter.address,
      // This would be the ABI encoded function data we want to call
      greeter.interface.encodeFunctionData("setGreeting", [greeting]),
    ]
    const msg = l2acc.interface.encodeFunctionData(
      "forward",
      args,
    )

    // 4. Relay the message (the sequencer has `enqeued` it on L1)
    const tx = await messenger.relayMessage(
      l2acc.address,
      await signer.getAddress(),
      msg,
      0,
    )
    await tx.wait()

    expect(await greeter.greeting()).to.be.equal(greeting)
  })
})
