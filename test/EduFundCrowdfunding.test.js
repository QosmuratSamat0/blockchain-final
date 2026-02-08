const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("EduFundCrowdfunding", function () {
  async function deployFixture() {
    const [platform, creator, contributor, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("EduFundToken");
    const token = await Token.connect(platform).deploy();
    await token.waitForDeployment();

    const Crowdfunding = await ethers.getContractFactory("EduFundCrowdfunding");
    const crowdfunding = await Crowdfunding.connect(platform).deploy(
      platform.address,
      await token.getAddress()
    );
    await crowdfunding.waitForDeployment();

    // Allow crowdfunding contract to mint EDU tokens
    await (await token.connect(platform).setMinter(await crowdfunding.getAddress())).wait();

    return { token, crowdfunding, platform, creator, contributor, other };
  }

  it("createCampaign: creates campaign and emits CampaignCreated", async function () {
    const { crowdfunding, creator } = await loadFixture(deployFixture);

    const goal = ethers.parseEther("1");
    const durationDays = 7;
    const category = 2; // Startup

    await expect(
      crowdfunding.connect(creator).createCampaign("My Campaign", goal, durationDays, category)
    ).to.emit(crowdfunding, "CampaignCreated");

    expect(await crowdfunding.campaignCount()).to.equal(1n);

    const c = await crowdfunding.getCampaign(0);
    expect(c.creator).to.equal(creator.address);
    expect(c.title).to.equal("My Campaign");
    expect(c.fundingGoal).to.equal(goal);
    expect(c.totalRaised).to.equal(0n);
    expect(c.finalized).to.equal(false);
    expect(c.category).to.equal(category);
    expect(c.deadline).to.be.greaterThan(0n);
  });

  it("contribute: updates totals, stores contribution, splits commission, and mints EDU tokens", async function () {
    const { crowdfunding, token, platform, creator, contributor } = await loadFixture(deployFixture);

    await (await crowdfunding.connect(creator).createCampaign("C1", ethers.parseEther("1"), 7, 0)).wait();

    const value = ethers.parseEther("0.5");
    const expectedCreator = (value * 90n) / 100n;
    const expectedPlatform = value - expectedCreator;
    const expectedTokens = value * 100n;

    const creatorBalBefore = await ethers.provider.getBalance(creator.address);
    const platformBalBefore = await ethers.provider.getBalance(platform.address);

    const tx = await crowdfunding.connect(contributor).contribute(0, { value });
    await expect(tx).to.emit(crowdfunding, "ContributionMade").withArgs(0, contributor.address, value);

    await tx.wait();

    const creatorBalAfter = await ethers.provider.getBalance(creator.address);
    const platformBalAfter = await ethers.provider.getBalance(platform.address);

    expect(creatorBalAfter - creatorBalBefore).to.equal(expectedCreator);
    expect(platformBalAfter - platformBalBefore).to.equal(expectedPlatform);

    expect(await crowdfunding.getContribution(0, contributor.address)).to.equal(value);

    const c = await crowdfunding.getCampaign(0);
    expect(c.totalRaised).to.equal(value);

    expect(await token.balanceOf(contributor.address)).to.equal(expectedTokens);
  });

  it("contribute: reverts on zero value and after deadline", async function () {
    const { crowdfunding, creator, contributor } = await loadFixture(deployFixture);

    await (await crowdfunding.connect(creator).createCampaign("C2", ethers.parseEther("1"), 1, 1)).wait();

    await expect(
      crowdfunding.connect(contributor).contribute(0, { value: 0 })
    ).to.be.revertedWith("Contribution must be > 0");

    const c = await crowdfunding.getCampaign(0);
    await time.increaseTo(c.deadline + 1n);

    await expect(
      crowdfunding.connect(contributor).contribute(0, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Campaign deadline passed");
  });

  it("finalizeCampaign: only creator can finalize, only after deadline, sets finalized", async function () {
    const { crowdfunding, creator, other } = await loadFixture(deployFixture);

    await (await crowdfunding.connect(creator).createCampaign("C3", ethers.parseEther("1"), 1, 3)).wait();

    await expect(
      crowdfunding.connect(other).finalizeCampaign(0)
    ).to.be.revertedWith("Only creator can finalize");

    await expect(
      crowdfunding.connect(creator).finalizeCampaign(0)
    ).to.be.revertedWith("Deadline not reached");

    const c1 = await crowdfunding.getCampaign(0);
    await time.increaseTo(c1.deadline + 1n);

    const tx = await crowdfunding.connect(creator).finalizeCampaign(0);
    await expect(tx).to.emit(crowdfunding, "CampaignFinalized").withArgs(0, 0n);

    const c2 = await crowdfunding.getCampaign(0);
    expect(c2.finalized).to.equal(true);

    await expect(
      crowdfunding.connect(creator).finalizeCampaign(0)
    ).to.be.revertedWith("Already finalized");
  });
});
