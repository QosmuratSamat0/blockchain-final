
function initContracts() {
    if (!signer) return;
    
    crowdfundingContract = new ethers.Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, signer);
    tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
}


async function loadBalances() {
    if (!provider || !currentAccount) return;
    
    try {
        // ETH balance
        const ethBalance = await provider.getBalance(currentAccount);
        const formattedEth = parseFloat(ethers.formatEther(ethBalance)).toFixed(4);
        document.getElementById("ethBalance").textContent = `${formattedEth} ETH`;
        
        // EDU token balance
        if (tokenContract) {
            try {
                const tokenBalance = await tokenContract.balanceOf(currentAccount);
                const formattedToken = parseFloat(ethers.formatEther(tokenBalance)).toFixed(2);
                document.getElementById("eduBalance").textContent = `${formattedToken} EDU`;
            } catch (e) {
                document.getElementById("eduBalance").textContent = "0 EDU";
            }
        }
    } catch (error) {
        console.error("Error loading balances:", error);
    }
}
