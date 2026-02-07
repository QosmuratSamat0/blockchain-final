
function showTxStatus(type, message) {
    const statusEl = document.getElementById("txStatus");
    const iconEl = document.getElementById("txIcon");
    const msgEl = document.getElementById("txMessage");
    
    statusEl.style.display = "block";
    statusEl.className = `tx-status tx-${type}`;
    
    const icons = {
        pending: '<i class="fas fa-spinner fa-spin"></i>',
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-times-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>'
    };
    
    iconEl.innerHTML = icons[type] || icons.pending;
    msgEl.textContent = message;
}

function hideTxStatus() {
    document.getElementById("txStatus").style.display = "none";
}

function getTimeLeft(deadline) {
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function setupMenuNavigation() {
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(m => m.classList.remove("active"));
            item.classList.add("active");
            
            const section = item.dataset.section;
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    const sections = document.querySelectorAll(".section");
    sections.forEach(s => s.style.display = "none");
    
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.style.display = "block";
        
        if (sectionName === "campaigns" && currentAccount) {
            loadCampaigns();
        } else if (sectionName === "portfolio" && currentAccount) {
            loadPortfolio();
        } else if (sectionName === "dashboard" && currentAccount) {
            loadDashboardStats();
        }
    }
}
