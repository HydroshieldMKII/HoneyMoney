const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const tokenABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint amount) returns (bool)",
    "function mint(address to, uint amount)",
    "function burn(address from, uint amount)"
];

let signer, token;

const hardhatAccounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
];

// Toast utility
function showToast(message, type = "info") {
    const toastId = `toast-${Date.now()}`;
    const colorClass = {
        info: "text-bg-primary",
        success: "text-bg-success",
        error: "text-bg-danger",
        warning: "text-bg-warning"
    }[type] || "text-bg-secondary";

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center ${colorClass}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body" style="word-wrap: break-word; overflow-wrap: break-word; max-width: 300px; white-space: normal;">${message}</div>
            </div>
        </div>
    `;

    const container = document.getElementById("toast-container");
    container.insertAdjacentHTML("beforeend", toastHTML);

    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    //delete the toast after 5 seconds
    setTimeout(() => {
        toastEl.remove();
    }, 5000);
}

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();

        const address = await signer.getAddress();
        document.getElementById("wallet").innerText = address;

        token = new ethers.Contract(tokenAddress, tokenABI, signer);

        updateBalance(address);
        updateLeaderboard();

        document.getElementById("connect").style.display = "none";
    } else {
        showToast("Install MetaMask first!", "error");
    }
});

document.getElementById("connect").onclick = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    const address = await signer.getAddress();
    document.getElementById("wallet").innerText = address;

    token = new ethers.Contract(tokenAddress, tokenABI, signer);

    updateBalance(address);
    updateLeaderboard();
};

async function updateBalance(address) {
    try {
        const rawBalance = await token.balanceOf(address);
        const formatted = ethers.utils.formatUnits(rawBalance, 18);
        const display = new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 4,
        }).format(parseFloat(formatted));

        document.getElementById("balance").innerText = display;
    } catch (err) {
        document.getElementById("balance").innerText = "Error";
        console.error("Error getting balance:", err);
    }
}

async function updateLeaderboard() {
    const leaderboardBody = document.querySelector("#leaderboard tbody");
    leaderboardBody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

    const balances = await Promise.all(
        hardhatAccounts.map(async (address) => {
            try {
                const raw = await token.balanceOf(address);
                return {
                    address,
                    balance: parseFloat(ethers.utils.formatUnits(raw, 18))
                };
            } catch (e) {
                return {
                    address,
                    balance: 0
                };
            }
        })
    );

    balances.sort((a, b) => b.balance - a.balance);

    leaderboardBody.innerHTML = "";
    balances.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="text-monospace">${entry.address}</td>
            <td>${entry.balance.toFixed(4)}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

document.getElementById("send").onclick = async () => {
    const recipient = document.getElementById("recipient").value;
    const amount = document.getElementById("amount").value;

    try {
        const tx = await token.transfer(recipient, ethers.utils.parseUnits(amount, 18));
        await tx.wait();

        showToast("Transfer successful! You sent " + amount + " tokens to " + recipient, "success");
        updateBalance(await signer.getAddress());
        updateLeaderboard();
    } catch (err) {
        showToast("Transfer failed: " + err.message, "error");
    }
};

document.getElementById("mint").onclick = async () => {
    const to = document.getElementById("mintTo").value || await signer.getAddress();
    const amount = document.getElementById("mintAmount").value;

    try {
        const tx = await token.mint(to, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
        showToast("You minted " + amount + " tokens to " + to, "success");
        updateBalance(await signer.getAddress());
        updateLeaderboard();
    } catch (err) {
        showToast("Mint failed: " + err.message, "error");
    }
};

document.getElementById("burn").onclick = async () => {
    const from = document.getElementById("burnFrom").value || await signer.getAddress();
    const amount = document.getElementById("burnAmount").value;

    try {
        const tx = await token.burn(from, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
        showToast("Burn successful!", "success");
        updateBalance(await signer.getAddress());
        updateLeaderboard();
    } catch (err) {
        showToast("Burn failed: " + err.message, "error");
    }
};
