// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEduFundToken {
    function mint(address to, uint256 amount) external;
}

contract EduFundCrowdfunding {
    address public platformCommissionAddress;
    IEduFundToken public eduToken;
    
    enum Category{
        Research,
        Hackathon,
        Startup,
        Event
    }

    struct Campaign {
        address creator;
        string title;
        uint256 fundingGoal;
        uint256 deadline;
        uint256 totalRaised;
        bool finalized;
        Category category;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(address => uint256[]) public userCampaigns; // Track campaigns a user contributed to
    uint256 public campaignCount;
    
    event CampaignCreated(uint256 indexed campaignId, address creator, string title, uint256 goal, uint256 deadline);
    event ContributionMade(uint256 indexed campaignId, address contributor, uint256 amount);
    event CommissionSplit(uint256 indexed campaignId, uint256 creatorAmount, uint256 platformAmount);
    event CampaignFinalized(uint256 indexed campaignId, uint256 totalRaised);
    
    constructor(address _platformAddress, address _tokenAddress) {
        platformCommissionAddress = _platformAddress;
        eduToken = IEduFundToken(_tokenAddress);
    }
    
    function createCampaign(string memory _title, uint256 _fundingGoal, uint256 _durationDays, Category _category) external {
        require(_fundingGoal > 0, "Funding goal must be > 0");
        require(_durationDays > 0, "Duration must be > 0");
        
        uint256 campaignId = campaignCount++;
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            title: _title,
            fundingGoal: _fundingGoal,
            deadline: block.timestamp + (_durationDays * 1 days),
            totalRaised: 0,
            finalized: false,
            category: _category
        });
        
        emit CampaignCreated(campaignId, msg.sender, _title, _fundingGoal, campaigns[campaignId].deadline);
    }
    
    function contribute(uint256 _campaignId) external payable {
        require(_campaignId < campaignCount, "Campaign does not exist");
        require(msg.value > 0, "Contribution must be > 0");
        require(!campaigns[_campaignId].finalized, "Campaign is finalized");
        require(block.timestamp < campaigns[_campaignId].deadline, "Campaign deadline passed");
        
        Campaign storage campaign = campaigns[_campaignId];
        
        // Track new contribution if it's first time user contributes to this campaign
        if (contributions[_campaignId][msg.sender] == 0) {
            userCampaigns[msg.sender].push(_campaignId);
        }
        
        contributions[_campaignId][msg.sender] += msg.value;
        campaign.totalRaised += msg.value;
        
        // 90% to creator, 10% to platform
        uint256 creatorAmount = (msg.value * 90) / 100;
        uint256 platformAmount = msg.value - creatorAmount;
        
        (bool successCreator, ) = payable(campaign.creator).call{value: creatorAmount}("");
        require(successCreator, "Transfer to creator failed");

        (bool successPlatform, ) = payable(platformCommissionAddress).call{value: platformAmount}("");
        require(successPlatform, "Transfer to platform failed");

        
        // Mint EDU tokens (1 EDU per 0.01 ETH)
        uint256 tokenAmount = (msg.value * 100);
        eduToken.mint(msg.sender, tokenAmount);
        
        emit ContributionMade(_campaignId, msg.sender, msg.value);
        emit CommissionSplit(_campaignId, creatorAmount, platformAmount);
    }
    
    function finalizeCampaign(uint256 _campaignId) external {
        require(_campaignId < campaignCount, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only creator can finalize");
        require(block.timestamp > campaign.deadline, "Deadline not reached");
        require(!campaign.finalized, "Already finalized");
        
        campaign.finalized = true;
        emit CampaignFinalized(_campaignId, campaign.totalRaised);
    }
    
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }
    
    function getContribution(uint256 _campaignId, address _contributor) external view returns (uint256) {
        return contributions[_campaignId][_contributor];
    }

    function getCampaignCategory(uint256 _campaignId) external view returns (Category) {
        require(_campaignId < campaignCount, "Campaign does not exist");
        return campaigns[_campaignId].category;
    }

    function getContributions(address _user) external view returns (uint256[] memory campaignIds, uint256[] memory amounts) {
        uint256 count = userCampaigns[_user].length;
        campaignIds = new uint256[](count);
        amounts = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 campaignId = userCampaigns[_user][i];
            campaignIds[i] = campaignId;
            amounts[i] = contributions[campaignId][_user];
        }
        
        return (campaignIds, amounts);
    }
}