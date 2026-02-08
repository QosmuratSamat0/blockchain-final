
document.addEventListener("DOMContentLoaded", () => {
    setupMenuNavigation();
    
    checkMetaMaskAvailability();
    
    const contributeAmountEl = document.getElementById("contributeAmount");
    if (contributeAmountEl) {
        contributeAmountEl.addEventListener("input", updateRewardPreview);
    }
});

function checkMetaMaskAvailability() {
    if (window.ethereum) {
        setupMetaMaskListeners();
        checkConnection();
    } else {
        setTimeout(() => {
            if (window.ethereum) {
                setupMetaMaskListeners();
                checkConnection();
            } else {
                console.log("MetaMask not detected on page load. User can click 'Connect Wallet' to trigger request.");
            }
        }, 1000);
    }
}

function setupMetaMaskListeners() {
    if (!window.ethereum) return;
    
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => {
        console.log("Network changed, reloading...");
        window.location.reload();
    });
}
