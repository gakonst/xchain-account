// Deploy the XChain Account to L2
import hre from 'hardhat'

const L2_MESSENGER = process.env.L2_MESSENGER || "0x4200000000000000000000000000000000000007"
const L1_OWNER = process.env.L1_OWNER || "0x1a9c8182c09f50c8318d769245bea52c32be35bc" // uni timelock by default

async function main() {
  const factory = await (hre as any).ethers.getContractFactory("CrossChainAccount");
  const contract = await factory.deploy(L2_MESSENGER, L1_OWNER);
  await contract.deployed();
  console.log(`XChain Account owned by ${L1_OWNER} deployed to ${contract.address}. Set your L2 contract's owner to this contract's address.`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
