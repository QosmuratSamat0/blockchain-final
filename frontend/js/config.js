const CROWDFUNDING_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";        

const SUPPORTED_NETWORKS = {
    1: "Ethereum Mainnet",
    5: "Goerli Testnet",
    11155111: "Sepolia Testnet",
    31337: "Hardhat Local",
    1337: "Localhost"
};

const CROWDFUNDING_ABI = [
    "function campaignCount() view returns (uint256)",
    "function campaigns(uint256) view returns (address creator, string title, uint256 fundingGoal, uint256 deadline, uint256 totalRaised, bool finalized, uint8 category)",
    "function contributions(uint256, address) view returns (uint256)",
    "function createCampaign(string memory _title, uint256 _fundingGoal, uint256 _durationDays, uint8 _category)",
    "function contribute(uint256 _campaignId) payable",
    "function finalizeCampaign(uint256 _campaignId)",
    "function getCampaign(uint256 _campaignId) view returns (tuple(address creator, string title, uint256 fundingGoal, uint256 deadline, uint256 totalRaised, bool finalized, uint8 category))",
    "function getContribution(uint256 _campaignId, address _contributor) view returns (uint256)",
    "event CampaignCreated(uint256 indexed campaignId, address creator, string title, uint256 goal, uint256 deadline)",
    "event ContributionMade(uint256 indexed campaignId, address contributor, uint256 amount)",
    "event CampaignFinalized(uint256 indexed campaignId, uint256 totalRaised)"
];

const TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const CATEGORY_NAMES = ["Research", "Hackathon", "Startup", "Event"];
