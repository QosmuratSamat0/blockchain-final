let provider;
let signer;

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask not installed");
        return;
    }

    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
    });

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    document.getElementById("wallet").innerText =
        "Wallet: " + accounts[0];
}
