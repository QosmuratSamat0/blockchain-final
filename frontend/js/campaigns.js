// CAMPAIGN MANAGEMENT 

async function loadCampaigns() {
    if (!crowdfundingContract) {
        document.getElementById("campaignsContainer").innerHTML = 
            '<p class="loading-text">Please connect wallet and configure contract address.</p>';
        return;
    }
    
    try {
        const container = document.getElementById("campaignsContainer");
        container.innerHTML = '<p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading campaigns...</p>';
        
        const count = await crowdfundingContract.campaignCount();
        allCampaigns = [];
        
        for (let i = 0; i < count; i++) {
            try {
                const campaign = await crowdfundingContract.campaigns(i);
                allCampaigns.push({
                    id: i,
                    creator: campaign[0],
                    title: campaign[1],
                    fundingGoal: campaign[2],
                    deadline: campaign[3],
                    totalRaised: campaign[4],
                    finalized: campaign[5],
                    category: Number(campaign[6])
                });
            } catch (e) {
                console.error(`Error loading campaign ${i}:`, e);
            }
        }
        
        displayCampaigns(allCampaigns);
        
    } catch (error) {
        console.error("Error loading campaigns:", error);
        document.getElementById("campaignsContainer").innerHTML = 
            `<p class="error-text">Error loading campaigns: ${error.message}</p>`;
    }
}

function displayCampaigns(campaigns) {
    const container = document.getElementById("campaignsContainer");
    
    if (campaigns.length === 0) {
        container.innerHTML = '<p class="loading-text">No campaigns found. Create the first one!</p>';
        return;
    }
    
    container.innerHTML = campaigns.map(campaign => {
        const goalEth = parseFloat(ethers.formatEther(campaign.fundingGoal));
        const raisedEth = parseFloat(ethers.formatEther(campaign.totalRaised));
        const percent = goalEth > 0 ? Math.min(100, Math.floor((raisedEth / goalEth) * 100)) : 0;
        const deadline = new Date(Number(campaign.deadline) * 1000);
        const now = new Date();
        const goalReached = raisedEth >= goalEth;
        const isActive = deadline > now && !campaign.finalized && !goalReached;
        const timeLeft = getTimeLeft(deadline);
        const isCreator = currentAccount && campaign.creator.toLowerCase() === currentAccount.toLowerCase();
        
        return `
            <div class="campaign-card ${isActive ? '' : 'campaign-ended'}">
                <div class="campaign-header">
                    <span class="category-badge category-${campaign.category}">
                        ${CATEGORY_NAMES[campaign.category]}
                    </span>
                    <span class="status-badge ${isActive ? 'status-active' : 'status-ended'}">
                        ${isActive ? 'Active' : (campaign.finalized ? 'Finalized' : (goalReached ? 'Goal Reached' : 'Ended'))}
                    </span>
                </div>
                <h3>${escapeHtml(campaign.title)}</h3>
                <p class="creator">by ${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}</p>
                <p class="goal">Goal: ${goalEth.toFixed(4)} ETH</p>
                
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percent}%"></div>
                </div>
                <p class="progress-text">${raisedEth.toFixed(4)} / ${goalEth.toFixed(4)} ETH (${percent}%)</p>
                
                <p class="countdown">${isActive ? timeLeft : 'Campaign ended'}</p>
                
                <div class="campaign-actions">
                    ${isActive ? `
                        <button class="btn-primary btn-small" onclick="openContributeModal(${campaign.id}, '${escapeHtml(campaign.title)}')">
                            <i class="fas fa-hand-holding-usd"></i> Contribute
                        </button>
                    ` : ''}
                    ${isCreator && !campaign.finalized && (goalReached || deadline <= now) ? `
                        <button class="btn-secondary btn-small" onclick="finalizeCampaign(${campaign.id})">
                            <i class="fas fa-check"></i> Finalize
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterCampaigns() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const categoryFilter = document.getElementById("categoryFilter").value;
    const statusFilter = document.getElementById("statusFilter").value;
    
    const now = new Date();
    
    const filtered = allCampaigns.filter(campaign => {
        // Search filter
        if (searchTerm && !campaign.title.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Category filter
        if (categoryFilter && campaign.category !== parseInt(categoryFilter)) {
            return false;
        }
        
        // Status filter
        const deadline = new Date(Number(campaign.deadline) * 1000);
        const isActive = deadline > now && !campaign.finalized;
        
        if (statusFilter === "active" && !isActive) return false;
        if (statusFilter === "completed" && isActive) return false;
        
        return true;
    });
    
    displayCampaigns(filtered);
}

// CREATE CAMPAIGN 

async function createCampaign() {
    if (!crowdfundingContract || !currentAccount) {
        showTxStatus("error", "Please connect your wallet first.");
        return;
    }
    
    const title = document.getElementById("campaignTitle").value.trim();
    const goalEth = document.getElementById("fundingGoal").value;
    const duration = document.getElementById("duration").value;
    const category = document.getElementById("category").value;
    
    // Validation
    if (!title) {
        showTxStatus("error", "Please enter a campaign title.");
        return;
    }
    if (!goalEth || parseFloat(goalEth) <= 0) {
        showTxStatus("error", "Please enter a valid funding goal.");
        return;
    }
    if (!duration || parseInt(duration) <= 0) {
        showTxStatus("error", "Please enter a valid duration.");
        return;
    }
    
    try {
        showTxStatus("pending", "Creating campaign... Please confirm in MetaMask.");
        
        const goalWei = ethers.parseEther(goalEth);
        const tx = await crowdfundingContract.createCampaign(
            title, 
            goalWei, 
            parseInt(duration), 
            parseInt(category)
        );
        
        showTxStatus("pending", `Transaction submitted. Waiting for confirmation... (${tx.hash.slice(0, 10)}...)`);
        
        const receipt = await tx.wait();
        
        showTxStatus("success", "Campaign created successfully!");
        
        // Clear form
        document.getElementById("campaignTitle").value = "";
        document.getElementById("fundingGoal").value = "";
        document.getElementById("duration").value = "";
        
        // Reload campaigns
        await loadCampaigns();
        
        // Switch to campaigns view
        document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
        document.querySelector('[data-section="campaigns"]').classList.add("active");
        showSection("campaigns");
        
        setTimeout(hideTxStatus, 3000);
        
    } catch (error) {
        console.error("Error creating campaign:", error);
        showTxStatus("error", "Failed to create campaign: " + (error.reason || error.message));
    }
}

// CONTRIBUTION 

function openContributeModal(campaignId, title) {
    selectedCampaignId = campaignId;
    document.getElementById("modalTitle").textContent = `Contribute to: ${title}`;
    document.getElementById("contributeAmount").value = "";
    document.getElementById("rewardTokens").textContent = "0";
    document.getElementById("contributeModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("contributeModal").style.display = "none";
    selectedCampaignId = null;
}

function updateRewardPreview() {
    const amountEth = parseFloat(document.getElementById("contributeAmount").value) || 0;
    // 1 EDU per 0.01 ETH = 100 EDU per ETH
    const tokens = amountEth * 100;
    document.getElementById("rewardTokens").textContent = tokens.toFixed(2);
}

async function confirmContribution() {
    if (selectedCampaignId === null) return;
    
    if (!crowdfundingContract || !signer) {
        showTxStatus("error", "Please connect your wallet first.");
        return;
    }
    
    const amountEth = document.getElementById("contributeAmount").value;
    
    if (!amountEth || parseFloat(amountEth) <= 0) {
        showTxStatus("error", "Please enter a valid contribution amount.");
        return;
    }
    
    // Save campaign ID before closing modal (closeModal sets it to null)
    const campaignId = selectedCampaignId;
    closeModal();
    
    try {
        showTxStatus("pending", "Processing contribution... Please confirm in MetaMask.");
        
        const amountWei = ethers.parseEther(amountEth);
        const tx = await crowdfundingContract.contribute(campaignId, {
            value: amountWei
        });
        
        showTxStatus("pending", `Transaction submitted. Waiting for confirmation... (${tx.hash.slice(0, 10)}...)`);
        
        const receipt = await tx.wait();
        
        const tokens = parseFloat(amountEth) * 100;
        showTxStatus("success", `Contribution successful! You received ${tokens.toFixed(2)} EDU tokens as reward.`);
        
        // Reload data
        await Promise.all([
            loadBalances(),
            loadCampaigns(),
            loadPortfolio()
        ]);
        
        setTimeout(hideTxStatus, 5000);
        
    } catch (error) {
        console.error("Error contributing:", error);
        showTxStatus("error", "Contribution failed: " + (error.reason || error.message));
    }
}

// FINALIZE CAMPAIGN 

async function finalizeCampaign(campaignId) {
    if (!crowdfundingContract) return;
    
    try {
        showTxStatus("pending", "Finalizing campaign... Please confirm in MetaMask.");
        
        const tx = await crowdfundingContract.finalizeCampaign(campaignId);
        
        showTxStatus("pending", `Transaction submitted. Waiting for confirmation...`);
        
        await tx.wait();
        
        showTxStatus("success", "Campaign finalized successfully!");
        
        await loadCampaigns();
        
        setTimeout(hideTxStatus, 3000);
        
    } catch (error) {
        console.error("Error finalizing campaign:", error);
        showTxStatus("error", "Failed to finalize: " + (error.reason || error.message));
    }
}
