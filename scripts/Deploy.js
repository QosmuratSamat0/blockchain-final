async function main() {
    console.log("Deploying EduFund contracts...\n");

    const EduFundToken = await ethers.getContractFactory("EduFundToken");
    const EduFundCrowdfunding = await ethers.getContractFactory("EduFundCrowdfunding");

    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}\n`);

    console.log("Deploying EduFundToken...");
    const token = await EduFundToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`EduFundToken deployed to: ${tokenAddress}\n`);

    console.log("Deploying EduFundCrowdfunding...");
    const crowdfunding = await EduFundCrowdfunding.deploy(
        deployer.address, 
        tokenAddress       
    );
    await crowdfunding.waitForDeployment();
    const crowdfundingAddress = await crowdfunding.getAddress();
    console.log(`EduFundCrowdfunding deployed to: ${crowdfundingAddress}\n`);

    console.log("Setting EduFundCrowdfunding as token minter...");
    const tx = await token.setMinter(crowdfundingAddress);
    await tx.wait();
    console.log(`Minter role assigned\n`);

    console.log("CONTRACT ADDRESSES:");
    console.log(`EduFundToken:         ${tokenAddress}`);
    console.log(`EduFundCrowdfunding:  ${crowdfundingAddress}`);
    console.log(`Platform Address:     ${deployer.address}`);

    console.log("UPDATE YOUR frontend/app.js WITH THESE ADDRESSES:\n");
    console.log(`const CROWDFUNDING_ADDRESS = "${crowdfundingAddress}";`);
    console.log(`const TOKEN_ADDRESS = "${tokenAddress}";\n`);

    console.log("Deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
