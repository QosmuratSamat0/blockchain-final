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

function updateProgress(current, goal) {
    const percent = Math.floor((current / goal) * 100);

    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressText").innerText =
        current + " / " + goal + " ETH (" + percent + "%)";
}

updateProgress(1.2, 3);

function startCountdown(seconds) {
    const el = document.getElementById("countdown");

    const interval = setInterval(() => {
        if (seconds <= 0) {
            el.innerText = "Campaign ended";
            clearInterval(interval);
            return;
        }

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        el.innerText = `Time left: ${days}d ${hours}h ${minutes}m`;
        seconds--;
    }, 1000);
}

startCountdown(86400);
