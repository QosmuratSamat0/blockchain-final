
async function loadPortfolio() {
    if (!crowdfundingContract || !currentAccount) return;
    
    try {
        const myCampaigns = allCampaigns.filter(
            c => c.creator.toLowerCase() === currentAccount.toLowerCase()
        );
        
        const myCampaignsEl = document.getElementById("myCampaigns");
        if (myCampaigns.length === 0) {
            myCampaignsEl.innerHTML = '<p class="loading-text">You haven\'t created any campaigns yet.</p>';
        } else {
            displayCampaignsInElement(myCampaigns, myCampaignsEl);
        }
        
        const myContribsEl = document.getElementById("myContributionsList");
        let contribHtml = '';
        let totalContributed = 0n;
        
        try {
            const [campaignIds, amounts] = await crowdfundingContract.getContributions(currentAccount);
            
            for (let i = 0; i < campaignIds.length; i++) {
                const campaignId = campaignIds[i];
                const amount = amounts[i];
                
                const campaign = allCampaigns.find(c => c.id === BigInt(campaignId));
                if (campaign && amount > 0n) {
                    const contribEth = parseFloat(ethers.formatEther(amount));
                    totalContributed += amount;
                    contribHtml += `
                        <div class="contribution-item">
                            <span class="contrib-campaign">${escapeHtml(campaign.title)}</span>
                            <span class="contrib-amount">${contribEth.toFixed(4)} ETH</span>
                        </div>
                    `;
                }
            }
        } catch (e) {
            // Fallback to old method if getContributions fails
            console.warn("getContributions not available, using fallback method:", e);
            for (const campaign of allCampaigns) {
                try {
                    const contrib = await crowdfundingContract.getContribution(campaign.id, currentAccount);
                    if (contrib > 0n) {
                        const contribEth = parseFloat(ethers.formatEther(contrib));
                        totalContributed += contrib;
                        contribHtml += `
                            <div class="contribution-item">
                                <span class="contrib-campaign">${escapeHtml(campaign.title)}</span>
                                <span class="contrib-amount">${contribEth.toFixed(4)} ETH</span>
                            </div>
                        `;
                    }
                } catch (err) {
                    console.error(`Error checking contribution for campaign ${campaign.id}:`, err);
                }
            }
        }
        
        if (contribHtml) {
            const totalEth = parseFloat(ethers.formatEther(totalContributed));
            myContribsEl.innerHTML = contribHtml + `
                <div class="contribution-total">
                    <span>Total Contributed:</span>
                    <span>${totalEth.toFixed(4)} ETH</span>
                </div>
            `;
        } else {
            myContribsEl.innerHTML = '<p class="loading-text">You haven\'t contributed to any campaigns yet.</p>';
        }
        
    } catch (error) {
        console.error("Error loading portfolio:", error);
    }
}

function displayCampaignsInElement(campaigns, container) {
    const goalEth = (camp) => parseFloat(ethers.formatEther(camp.fundingGoal));
    const raisedEth = (camp) => parseFloat(ethers.formatEther(camp.totalRaised));
    
    container.innerHTML = campaigns.map(campaign => {
        const goal = goalEth(campaign);
        const raised = raisedEth(campaign);
        const percent = goal > 0 ? Math.min(100, Math.floor((raised / goal) * 100)) : 0;
        const deadline = new Date(Number(campaign.deadline) * 1000);
        const isActive = deadline > new Date() && !campaign.finalized;
        
        return `
            <div class="campaign-card campaign-small">
                <span class="category-badge category-${campaign.category}">${CATEGORY_NAMES[campaign.category]}</span>
                <h4>${escapeHtml(campaign.title)}</h4>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percent}%"></div>
                </div>
                <p class="progress-text">${raised.toFixed(4)} / ${goal.toFixed(4)} ETH</p>
                <span class="status-badge ${isActive ? 'status-active' : 'status-ended'}">
                    ${isActive ? 'Active' : 'Ended'}
                </span>
            </div>
        `;
    }).join('');
}


async function loadDashboardStats() {
    document.getElementById("totalCampaigns").textContent = allCampaigns.length;
    
    const now = new Date();
    const active = allCampaigns.filter(c => 
        new Date(Number(c.deadline) * 1000) > now && !c.finalized
    ).length;
    document.getElementById("activeCampaigns").textContent = active;
    
    if (crowdfundingContract && currentAccount) {
        let total = 0n;
        
        try {
            // Use new getContributions for efficiency
            const [campaignIds, amounts] = await crowdfundingContract.getContributions(currentAccount);
            for (let i = 0; i < amounts.length; i++) {
                total += amounts[i];
            }
        } catch (e) {
            // Fallback to old method
            console.warn("getContributions not available, using fallback:", e);
            for (const campaign of allCampaigns) {
                try {
                    const contrib = await crowdfundingContract.getContribution(campaign.id, currentAccount);
                    total += contrib;
                } catch (err) {}
            }
        }
        
        const totalEth = parseFloat(ethers.formatEther(total));
        document.getElementById("myContributions").textContent = `${totalEth.toFixed(4)} ETH`;
    }
}
