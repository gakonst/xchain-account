// Script for deploying a Uniswap autonomous proposal that will call to L2
// Run with:
// FUNCTION=<your function signature> 
// L2_ACCOUNT=<your l2 account owned by L1 Compound governance> 
// L2_TARGET=<the l2 contract you want to call>
// ARGS=the function args of the L2 contract you're calling, separated by spaces
// DESCRIPTION= the text description of your proposal
import { ethers } from 'ethers'
const CONTRACTS = require("./autogov-contracts.json")

// https://eth-mainnet.alchemyapi.io/v2/Lc7oIGYeL_QvInzI0Wiu_pOZZDEKBrdf
const URL = process.env.URL || "http://localhost:8545"
const provider = new ethers.providers.JsonRpcProvider(URL)

// Compound governance params
const GOVERNOR= process.env.GOVERNOR || "0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F"
const TOKEN = process.env.TOKEN || "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
// Optimism's L1 Messenger contract
const L1_MESSENGER = process.env.L1_MESSENGER || "0x902e5fF5A99C4eC1C21bbab089fdabE32EF0A5DF"

// No ETH is transferred (can be used to maybe move parts of the treasury from L1 to L2)
const VALUES=[0]

const FUNCTION = process.env.FUNCTION
const L2_ACCOUNT = process.env.L2_ACCOUNT
const L2_TARGET = process.env.L2_TARGET
const ARGS = process.env.ARGS
const DESCRIPTION = process.env.DESCRIPTION || ""
// default to 10m gas limit for xchain calls
const L2_GAS_LIMIT = process.env.GAS_LIMIT || 10_000_000

// Get the ABIs
const CrowdProposal = CONTRACTS.contracts['contracts/CrowdProposal.sol:CrowdProposal']
const L1_MESSENGER_ABI = ["function sendMessage(address _target, bytes memory _message, uint32 _gasLimit)"]
const L2_ACCOUNT_ABI = ["function forward(address target, bytes memory data)"]


const l2Acc = new ethers.utils.Interface(L2_ACCOUNT_ABI)

// The call which will be sent from the L2 account to the L2 contract
console.log(FUNCTION.split("(")[0], FUNCTION)
const l2Contract = new ethers.utils.Interface([ FUNCTION ])
console.log(FUNCTION.split("function ")[1].split("(")[0])
const calldata = l2Contract.encodeFunctionData(
    FUNCTION.split("function ")[1].split("(")[0],
    [ARGS],
)
console.log("OK2")
// The call executed by the L2 Messenger
const l2data = l2Acc.encodeFunctionData(
  "forward",
  [L2_TARGET, calldata]
)

// The call executed by the L1 Messenger to the L2 account
const data = new ethers.utils.Interface(L1_MESSENGER_ABI).encodeFunctionData(
  "sendMessage",
  [L2_ACCOUNT, l2data, L2_GAS_LIMIT]
)

// Author is the L2 Account
const AUTHOR=L2_ACCOUNT
// Receiver is the L1 Messenger's sendMessage
const TARGETS=[ L1_MESSENGER ]
const SIGNATURES=[ "sendMessage(address,bytes,uint32" ]
// ABI Encoded: Multisig address + amount
const CALLDATAS=["0x" + data.slice(10)]

// Compound Governance args
const args = [
    AUTHOR,
    TARGETS,
    VALUES,
    SIGNATURES,
    CALLDATAS,
    DESCRIPTION,
    TOKEN,
    GOVERNOR,
]

;(async () => {
  const signer = process.env.KEY ? new ethers.Wallet(process.env.KEY, provider) : provider.getSigner()
  const factory = new ethers.ContractFactory(CrowdProposal.abi, CrowdProposal.bin, signer)
  console.log("Deploying with args", args)
  const contract = await factory.deploy(...args)
  const receipt = await contract.deployTransaction.wait()
  console.log("Autonomous proposal contract deployed at", receipt.contractAddress)

  // this only works with hardhat as the testing env
  if (process.env.TESTING) {
    const VOTING_ABI = [
      "function transfer(address,uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function delegate(address)",
      "function getPriorVotes(address account, uint256 blockNumber) public view returns (uint96)",
    ]

    let token = new ethers.Contract(TOKEN, VOTING_ABI)
    const GOVERNOR_ABI = CONTRACTS.contracts['tests/contracts/GovernorAlpha.sol:GovernorAlpha'].abi
    const governor = new ethers.Contract(GOVERNOR, GOVERNOR_ABI, signer)

    // Use some UNI whales to test the proposal
    // https://etherscan.io/token/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984#balances
    const WHALES = [
      "0x9f41cecc435101045ea9f41d4ee8c5353f77e5d5",
      "0x662d905a1795ffdf8cfab0abe670dbff3a9fd247",
    ]

    for (const addr of WHALES) {
      const blk = await provider.getBlockNumber()
      console.log("GETTING", blk, contract.address, token.functions)
      await provider.send("hardhat_impersonateAccount", [addr])
      const delegate = provider.getSigner(addr)
      token = token.connect(delegate)
      const tx = await token.delegate(contract.address)
      const receipt = await tx.wait()
      console.log("Delegated", addr, receipt.from)
      console.log("Votes", await token.getPriorVotes(contract.address, blk))
    }

    // create the proposal with our votes
    console.log("Proposing..")
    await (await contract.propose()).wait()
    const proposalId = await contract.govProposalId()

    // mine a block so that voting starts
    await provider.send("evm_mine", [])

    // vote (others will also need to vote on the proposal if they did not
    // delegate to us
    console.log("Voting...")
    await (await contract.vote()).wait()

    // advance 7 days (this takes a while...)
    console.log('Waiting 7 days...')
    const delay = await governor.votingPeriod()
    for (let i = 0 ; i < delay.add(1).toNumber(); i++) {
      await provider.send("evm_mine", [])
    }

    // queue the proposal
    console.log("Queuing for execution...")
    await (await governor.queue(proposalId)).wait()

    // wait out the timelock delay
    await provider.send("evm_increaseTime", [172800])
    await provider.send("evm_mine", [])

    console.log("Executing")
    const receipt = await (await governor.execute(proposalId)).wait()
    console.log("Transaction executed", receipt)

    // TODO: Test that the data format is correct
  }
})();

