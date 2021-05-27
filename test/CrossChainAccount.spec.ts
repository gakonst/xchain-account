import { Wallet, BigNumber, Contract } from 'ethers'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'

describe('CrossChainAccount', () => {
  it("forwards messages to target contract", async () => {
    // 1. Deploy the Messenger
    // 2. Deploy the L2 account
    // 3. Deploy the Test onlyOwner contract
    // 4. Send a msg to the messenger 
    //  messenger forwards it to the xchain acc
    //  xchain acc calls onlyOwner -> works
  })
  
})
