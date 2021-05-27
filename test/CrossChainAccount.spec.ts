import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('CrossChainAccount', () => {
  it("forwards messages to target contract", async () => {
    const [signer] = await ethers.getSigners()
    const gasLimit = 9_000_000
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

    const msg = l2acc.interface.encodeFunctionData(
      "forward",
      [
        greeter.address,
        greeter.interface.encodeFunctionData("setGreeting", [greeting]),
      ]
    )

    // 4. Send a msg to the messenger 
    //  * messenger forwards it to the xchain acc
    //  * xchain acc calls onlyOwner function
    const tx = await messenger.sendMessage(
      l2acc.address,
      msg,
      gasLimit,
    )
    await tx.wait()

    expect(await greeter.greeting()).to.be.equal(greeting)
  })
})
