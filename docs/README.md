PROJECT REPORT: EduFund Crowdfunding Platform

1. APPLICATION ARCHITECTURE OVERVIEW

The EduFund platform is a decentralized crowdfunding application built on blockchain technology. It consists of three main layers:

Smart Contract Layer:
- Two Solidity contracts deployed on Ethereum-compatible networks
- EduFundToken: ERC-20 token that serves as reward mechanism
- EduFundCrowdfunding: Main contract managing campaign lifecycle

Frontend Layer:
- HTML5 interface for user interaction
- Vanilla JavaScript with modular architecture (8 separate files)
- ethers.js library for blockchain communication
- Responsive CSS styling

Network Layer:
- Supports Hardhat Local (development)
- Supports Sepolia Testnet (testing)
- MetaMask integration for wallet management


2. DESIGN AND IMPLEMENTATION DECISIONS

Token Design (ERC-20):
- 18 decimal places for precision
- Minting mechanism: only authorized addresses can mint
- Automatic minting on contribution: users receive 100 EDU tokens per 1 ETH contributed
- No transfer restrictions - token is tradeable

Smart Contract Architecture:
- Campaign struct stores: creator, title, goal, deadline, totalRaised, finalized status, category
- Mapping-based storage for campaigns and contributions (gas efficient)
- Four campaign categories: Research, Hackathon, Startup, Event
- Deadline validation enforced on contributor side (block.timestamp check)

Fund Distribution Logic:
- 90% of contribution goes to campaign creator
- 10% goes to platform (commission)
- Transfer directly via low-level call{} for reliability
- Both transfers must succeed or entire transaction reverts

Contribution Tracking:
- getContribution(campaignId, address) returns single contribution
- getContributions(address) returns all campaigns where user contributed + amounts
- userCampaigns mapping tracks campaign IDs for each user

Frontend Architecture:
- config.js: Contract addresses and ABIs
- state.js: Global application state
- wallet.js: MetaMask connection and account management
- contracts.js: Contract initialization
- campaigns.js: Campaign display, creation, contribution logic
- portfolio.js: User's contributions and created campaigns
- ui.js: UI utilities and navigation
- main.js: Application initialization

Why This Approach:
- Modular code allows easy testing and maintenance
- Separation of concerns improves readability
- Direct transfers are safer than relying on safeTransferFrom
- Mapping-based storage is more gas-efficient than arrays
- getContributions() reduces frontend complexity (client gets all data in one call)


3. SMART CONTRACT LOGIC

EduFundToken Contract:

Constructor: Takes no parameters, initializes owner as deployer.

setMinter(address minter): Owner-only function that authorizes an address to mint tokens. Used during deployment to give crowdfunding contract permission to mint.

mint(address to, uint256 amount): Creates new tokens. Called by crowdfunding contract when users contribute. Amount = contribution in wei * 100.

Functions inherited from ERC-20: balanceOf, transfer, approve, transferFrom - standard token operations.

EduFundCrowdfunding Contract:

createCampaign(title, fundingGoal, durationDays, category):
- Validates goal > 0 and duration > 0
- Creates campaign with deadline = now + (durationDays * 1 day)
- Assigns incrementing ID (campaignCount++)
- Emits CampaignCreated event

contribute(campaignId):
- Validates campaign exists and is not finalized
- Validates deadline not passed
- Adds contribution to contributions[campaignId][user]
- Increments totalRaised
- Tracks user in userCampaigns if first contribution to campaign
- Splits incoming ETH: 90% to creator, 10% to platform
- Mints EDU tokens: msg.value * 100 equals EDU amount
- Emits ContributionMade and CommissionSplit events

finalizeCampaign(campaignId):
- Only creator can call
- Requires deadline to have passed
- Sets finalized = true (prevents further contributions)
- Emits CampaignFinalized event
- Does not refund if goal not reached (funds already distributed)

View Functions:
- getCampaign(id): Returns full campaign struct
- getContribution(campaignId, address): Returns how much address contributed to campaign
- getContributions(address): Returns array of campaign IDs and array of contribution amounts
- getCampaignCategory(id): Returns category enum value (0-3)
- campaigns(id): Direct access to campaign mapping
- contributions(campaignId, address): Direct access to contribution mapping

Security Considerations:
- Uses low-level call for transfers (more control than transfer function)
- Requires both transfers succeed (creator AND platform) for transaction to succeed
- Deadline check prevents contributions after expiration
- Only creator can finalize (prevents others from marking complete)
- No reentrancy risk (calls happen at end of function)


4. FRONTEND-TO-BLOCKCHAIN INTERACTION

MetaMask Connection Flow:
1. User clicks "Connect Wallet"
2. connectWallet() requests window.ethereum.request({method: 'eth_requestAccounts'})
3. User approves in MetaMask popup
4. Callback handler updates currentAccount state
5. initContracts() creates ethers Contract objects using BrowserProvider
6. UI updates to show connected wallet address

Campaign Display:
1. loadCampaigns() calls campaignCount() view
2. Loops from 0 to count-1, calling getCampaign(id)
3. Stores results in allCampaigns array
4. displayCampaigns() renders campaign cards with progress bars
5. Progress calculated as (totalRaised / goal) * 100

Contribution Process:
1. User enters amount and clicks contribute
2. confirmContribution() prepares transaction
3. Creates contract.contribute(campaignId) transaction
4. await signer.sendTransaction() sends to blockchain
5. Transaction hash displayed to user
6. loadCampaigns() called to refresh totals
7. Contribution confirmed when block is mined

Portfolio View:
1. loadPortfolio() calls getContributions(userAddress)
2. Returns two arrays: campaign IDs and amounts
3. Matches amounts with campaign titles from allCampaigns
4. Renders contribution list with amounts in ETH

Balance Display:
1. loadBalances() calls:
   - provider.getBalance(currentAccount) for ETH
   - tokenContract.balanceOf(currentAccount) for EDU
2. Formats using ethers.formatEther() for display
3. ETH shown with 4 decimals, EDU with 2 decimals

Network Validation:
1. On wallet connection, checks chainId
2. Compares against SUPPORTED_NETWORKS object
3. Shows warning if wrong network
4. Transaction will fail if submitted on wrong chain

Error Handling:
- Try-catch blocks around all contract calls
- User sees error messages in transaction status bar
- Console logs provide debugging info
- Graceful fallback if new functions unavailable


5. DEPLOYMENT AND EXECUTION INSTRUCTIONS

Prerequisites:
npm install (installs ethers.js, hardhat, and test dependencies)

Development Setup:

Step 1: Start Hardhat Local Node
Command: npx hardhat node
Output: Displays 20 test accounts with private keys
Listens on http://127.0.0.1:8545

Step 2: Deploy Contracts (in separate terminal)
Command: npx hardhat run scripts/deploy.js --network localhost
Output: Prints contract addresses for Token and Crowdfunding

Step 3: Configure Frontend
Edit frontend/js/config.js with returned addresses:
const CROWDFUNDING_ADDRESS = "0x...";
const TOKEN_ADDRESS = "0x...";

Step 4: Start Web Server
Command: python -m http.server 3000
Navigate to: http://localhost:3000

Step 5: Add Hardhat to MetaMask
Network name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337

Step 6: Import Test Accounts
Copy private key from hardhat node output
MetaMask: Import Account > Paste private key
First account has all test ETH (10000 ETH each account)

Testing Smart Contracts:
Command: npx hardhat test
Runs 13 tests covering:
- Campaign creation
- Contributions with token minting
- Commission split (90/10)
- Campaign finalization
- View functions
- Error cases

Tesnet Deployment (Sepolia):
1. Create .env file with SEPOLIA_PRIVATE_KEY
2. Update hardhat.config.js if sepolia network not configured
3. Export test ETH to Sepolia testnet (see section 6)
4. Command: npx hardhat run scripts/deploy.js --network sepolia
5. Update config.js with new contract addresses
6. Change MetaMask to Sepolia network
7. Contracts now live on public blockchain


6. OBTAINING TEST ETH

For Hardhat Local:
- Automatically provided on startup
- Each test account has 10000 ETH
- No external request needed
- Resets when hardhat node restarts

For Sepolia Testnet:

Option A: Alchemy Faucet (Recommended)
1. Visit https://sepoliafaucet.com
2. Sign in with Alchemy account (free signup)
3. Paste wallet address
4. Request test ETH (0.5 ETH per request)
5. Check wallet in 2-5 minutes

Option B: Chainlink Faucet
1. Visit https://faucets.chain.link
2. Select Sepolia from dropdown
3. Connect MetaMask wallet
4. Click "Send me test tokens"
5. Receive 0.1 ETH per request (needs LINK token)

Option C: QuickNode Faucet
1. Visit https://quicknode.com/faucets/ethereum-sepolia
2. Enter wallet address
3. Complete verification
4. Receive test ETH

Typical Amount Needed:
- Simple transaction: 0.001 - 0.01 ETH
- Campaign creation: 0.005 ETH
- Contribution: amount chosen by user + gas
- Portfolio operations: gas only (~0.001 ETH)

Transaction Cost Estimation:
- createCampaign: ~160,000 gas = 0.0016 ETH at 10 gwei
- contribute: ~180,000 gas = 0.0018 ETH at 10 gwei
- finalizeCampaign: ~37,000 gas = 0.00037 ETH at 10 gwei
- View functions: free (no gas cost)

Total recommended for testing: 1 ETH on Sepolia


APPLICATION FEATURES SUMMARY

User Capabilities:
- Connect MetaMask wallet
- View all campaigns with progress bars
- Create new campaigns with custom goals and durations
- Contribute to active campaigns
- Receive EDU tokens as rewards (100 per 1 ETH)
- View contribution history
- Monitor wallet balance (ETH and EDU)
- View dashboard with statistics
- Filter campaigns by title or category
- Finalize own campaigns after deadline

Campaign Management:
- 4 categories: Research, Hackathon, Startup, Event
- Adjustable funding goals and durations
- Deadline-based campaign lifecycle
- Automatic fund distribution upon contribution
- Finalization prevents further contributions
- Progress visualization with percentage bars


FILE STRUCTURE

contracts/
  EduFundingCrowdfunding.sol
  EduFundToken.sol

frontend/
  index.html
  style.css
  js/
    config.js
    state.js
    wallet.js
    contracts.js
    campaigns.js
    portfolio.js
    ui.js
    main.js

scripts/
  deploy.js

test/
  EduFundCrowdfunding.test.js
  EduFundToken.test.js

docs/
  (this report)

package.json
hardhat.config.js
