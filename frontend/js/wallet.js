
async function checkConnection() {
    try {
        if (!window.ethereum) {
            console.log("Waiting for MetaMask to inject window.ethereum...");
            return;
        }
        
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
            await connectWallet();
        }
    } catch (error) {
        console.error("Error checking connection:", error);
    }
}

async function connectWallet() {
    console.log("Connect Wallet clicked");
    console.log("window.ethereum available:", !!window.ethereum);
    
    // Check if MetaMask is available - wait a bit if not yet injected
    if (!window.ethereum) {
        console.log("Waiting for MetaMask injection...");
        // Give MetaMask another moment to inject
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    if (!window.ethereum) {
        const errorMsg = "MetaMask not detected. Please:\n1. Install MetaMask extension\n2. Refresh this page\n3. Try connecting again";
        console.error(errorMsg);
        showTxStatus("error", errorMsg);
        alert(errorMsg);
        return;
    }

    try {
        showTxStatus("pending", "Opening MetaMask...");
        
        console.log("Requesting accounts from MetaMask...");
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        console.log("Connected account:", accounts[0]);
        
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        currentAccount = accounts[0];
        
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        
        console.log("Connected to network:", chainId, SUPPORTED_NETWORKS[chainId]);
        
        if (!SUPPORTED_NETWORKS[chainId]) {
            showTxStatus("warning", `Unsupported network (${chainId}). Please switch to: ${Object.values(SUPPORTED_NETWORKS).join(", ")}`);
        } else {
            hideTxStatus();
        }
        updateWalletUI(currentAccount, chainId);
        
        initContracts();
        
        await Promise.all([
            loadBalances(),
            loadCampaigns()
        ]);

        document.getElementById("connectBtn").innerHTML = 
            '<i class="fas fa-check-circle"></i> Connected';
        document.getElementById("connectBtn").disabled = true;

    } catch (error) {
        console.error("Connection error:", error);
        showTxStatus("error", "Failed to connect wallet: " + error.message);
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // Disconnected
        currentAccount = null;
        updateWalletUI(null, null);
        document.getElementById("connectBtn").innerHTML = 
            '<i class="fas fa-plug"></i> Connect Wallet';
        document.getElementById("connectBtn").disabled = false;
    } else {
        currentAccount = accounts[0];
        updateWalletUI(currentAccount, null);
        loadBalances();
        loadCampaigns();
    }
}

function updateWalletUI(address, chainId) {
    const walletEl = document.getElementById("walletAddress");
    const networkEl = document.getElementById("networkInfo");
    
    if (address) {
        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        walletEl.textContent = shortAddress;
        walletEl.title = address;
    } else {
        walletEl.textContent = "Not connected";
    }
    
    if (chainId !== null) {
        const networkName = SUPPORTED_NETWORKS[chainId] || `Unknown (${chainId})`;
        networkEl.textContent = networkName;
        networkEl.className = SUPPORTED_NETWORKS[chainId] ? "info-value network-ok" : "info-value network-error";
    }
}
