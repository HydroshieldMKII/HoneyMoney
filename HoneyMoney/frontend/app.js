const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const tokenABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint amount) returns (bool)",
    "function mint(address to, uint amount)",
    "function burn(address from, uint amount)",
    "function isBlacklisted(address) view returns (bool)",
    "function blacklist(address, bool) returns (bool)",
    "function getBlacklistedAddresses() view returns (address[])",
    "function clearBlacklist()",
    "function togglePause()",
    "function isPaused() view returns (bool)",
    "function getOwner() view returns (address)",
    "function totalSupply() view returns (uint)",
];

let signer, token, provider;

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

// Helpers
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

    setTimeout(() => {
        toastEl.remove();
    }, 5000);
}

function decodeAndShowError(errorMessage) {
    let decodedError = errorMessage;
    if (errorMessage.includes('reverted with reason string')) {
        const reasonMatch = errorMessage.match(/reverted with reason string '([^']+)'/);
        if (reasonMatch) {
            decodedError = reasonMatch[1];
        }
    }
    showToast("Transaction was reverted: " + decodedError, "error");
}

// Functions

function tamperBlock(index) {
  const container = document.getElementById("blockchain-visual");
  const blockDivs = container.children;

  const tamperedDiv = blockDivs[index];
  tamperedDiv.style.backgroundColor = "#ffcccc";
  tamperedDiv.querySelector("strong").innerText += " (Tampered!)";

  // Show downstream invalidation
  for (let i = index + 1; i < blockDivs.length; i++) {
    blockDivs[i].style.backgroundColor = "#ffdddd";
    blockDivs[i].querySelector("strong").innerText += " (Invalid Chain!)";
  }
}

function renderBlockchain(blocks) {
  const container = document.getElementById("blockchain-visual");
  container.innerHTML = ""; // Clear

  blocks.forEach((block, index) => {
    const blockDiv = document.createElement("div");
    blockDiv.className = "d-inline-block border rounded m-1 p-2";
    blockDiv.style.backgroundColor = "#f1f1f1";
    blockDiv.style.width = "250px";

    blockDiv.innerHTML = `
      <strong>Block #${block.number}</strong><br/>
      <span style="font-size: 0.8em;">Hash: ${block.hash.slice(0, 10)}...</span><br/>
      <span style="font-size: 0.8em;">Parent: ${block.parentHash.slice(0, 10)}...</span><br/>
      <span style="font-size: 0.8em;">Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}</span><br/>
      <button class="btn btn-sm btn-warning mt-2" onclick="tamperBlock(${index})">Tamper</button>
    `;
    container.appendChild(blockDiv);
  });
}


async function loadAllBlocks() {
    console.log("Loading all blocks...");
  let blockNumber = 0;
  const blocks = [];

  // Fetch until block doesn't exist
  while (true) {
    try {
      const block = await provider.getBlock(blockNumber);
      console.log(`Fetched block #${blockNumber}`, block);
      if (!block) break;
      blocks.push(block);
      blockNumber++;
    } catch (e) {
        console.error(`Error fetching block #${blockNumber}:`, e);
      break;
    }
  }

  renderBlockchain(blocks);
}

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);

        signer = provider.getSigner();

        const address = await signer.getAddress();
        document.getElementById("wallet").innerText = address;

        token = new ethers.Contract(tokenAddress, tokenABI, signer);

        updateTotalSupply();
        updateContractOwner();
        updatePauseState();
        updateBalance(address);
        updateLeaderboard();

        loadAllBlocks();

        document.getElementById("connect").style.display = "none";
    } else {
        showToast("Metamask not detected!", "error");
    }
});

document.getElementById("connect").onclick = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    const address = await signer.getAddress();
    document.getElementById("wallet").innerText = address;

    token = new ethers.Contract(tokenAddress, tokenABI, signer);

    updateTotalSupply();
    updateContractOwner();
    updatePauseState();
    updateBalance(address);
    updateLeaderboard();
};

async function updateTotalSupply() {
    try {
        const rawSupply = await token.totalSupply();
        const formattedSupply = parseFloat(ethers.utils.formatUnits(rawSupply, 18)).toFixed(4);
        document.getElementById("totalSupply").innerText = formattedSupply;
    }
    catch (err) {
        console.error("Error getting total supply:", err);
        document.getElementById("totalSupply").innerText = "Error";
    }
}

async function updateContractOwner() {
    try {
        const owner = await token.getOwner();
        document.getElementById("contractOwner").innerText = owner;
    }
    catch (err) {
        console.error("Error getting contract owner:", err);
        document.getElementById("contractOwner").innerText = "Error";
    }
}

async function updatePauseState() {
    try {
        const isPaused = await token.isPaused();
        document.getElementById("pauseState").innerText = isPaused ? "Paused" : "Active";
        document.getElementById("togglePause").innerText = isPaused ? "Unpause Contract" : "Pause Contract";
        updatePauseState();
    } catch (err) {
        console.error("Error getting pause state:", err);
        document.getElementById("pauseState").innerText = "Error";
    }
}

async function updateBalance(address) {
    try {
        const rawBalance = await token.balanceOf(address);
        document.getElementById("balance").innerText = parseFloat(ethers.utils.formatUnits(rawBalance, 18)).toFixed(4);
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
                const rawBalance = await token.balanceOf(address);
                const isBlacklisted = await token.isBlacklisted(address);
                return {
                    address,
                    balance: parseFloat(ethers.utils.formatUnits(rawBalance, 18)),
                    isBlacklisted: isBlacklisted
                };
            } catch (e) {
                console.error("Error fetching balance for", address, e);
                return {
                    address,
                    balance: "UNKNOWN",
                    isBlacklisted: false
                };
            }
        })
    );

    console.log("Balances fetched:", balances);

    balances.sort((a, b) => b.balance - a.balance);

    leaderboardBody.innerHTML = "";
    balances.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="text-monospace ${entry.isBlacklisted ? "text-danger" : ""}">${entry.address}</td>
            <td>${entry.balance.toFixed(4)}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

document.getElementById("togglePause").onclick = async () => {
    try {
        const tx = await token.togglePause();
        await tx.wait();
        showToast("Contract pause state toggled", "success");
        updateLeaderboard();
    } catch (err) {
        decodeAndShowError(err.message);
    }
}
    
document.getElementById("send").onclick = async () => {
    const recipient = document.getElementById("recipient").value.trim();
    const amount = document.getElementById("amount").value.trim();

    if (!ethers.utils.isAddress(recipient)) {
        showToast("Invalid recipient address!", "error");
        return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        showToast("Invalid transfer amount!", "error");
        return;
    }

    console.log("Sending tokens:", recipient, amount);

    try {
        const tx = await token.transfer(recipient, ethers.utils.parseUnits(amount, 18));
        await tx.wait();

        showToast(`Transfer successful! You sent ${amount} tokens to ${recipient}`, "success");
        updateBalance(await signer.getAddress());
        updateLeaderboard();
    } catch (err) {
        decodeAndShowError(err.message);
    }
};


document.getElementById("mint").onclick = async () => {
    const to = document.getElementById("mintTo").value.trim() || await signer.getAddress();
    const amount = document.getElementById("mintAmount").value.trim();

    if (!ethers.utils.isAddress(to)) {
        showToast("Invalid address to mint to!", "error");
        return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        showToast("Invalid transfer amount!", "error");
        return;
    }

    try {
        const tx = await token.mint(to, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
        showToast(`You minted ${amount} tokens to ${to}`, "success");
        updateBalance(await signer.getAddress());
        updateTotalSupply();
        updateLeaderboard();
    } catch (err) {
        decodeAndShowError(err.message);
    }
};


document.getElementById("burn").onclick = async () => {
    const from = document.getElementById("burnFrom").value.trim() || await signer.getAddress();
    const amount = document.getElementById("burnAmount").value.trim();

    if (!ethers.utils.isAddress(from)) {
        showToast("Invalid address to burn from!", "error");
        return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        showToast("Invalid transfer amount!", "error");
        return;
    }

    try {
        const tx = await token.burn(from, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
        showToast("Burn successful!", "success");
        updateBalance(await signer.getAddress());
        updateTotalSupply();
        updateLeaderboard();
    } catch (err) {
        decodeAndShowError(err.message);
    }
};


document.getElementById("blacklist").onclick = async () => {
    const address = document.getElementById("blacklistAddress").value.trim();

    if (!ethers.utils.isAddress(address)) {
        showToast("Invalid address to blacklist!", "error");
        return;
    }

    try {
        const tx = await token.blacklist(address, true);
        await tx.wait();
        showToast(`Address ${address} has been blacklisted`, "success");
        updateLeaderboard();
    } catch (err) {
        decodeAndShowError(err.message);
    }
};

document.getElementById("unblacklist").onclick = async () => {
    const address = document.getElementById("blacklistAddress").value.trim();

    if (!ethers.utils.isAddress(address)) {
        showToast("Invalid address to unblacklist!", "error");
        return;
    }

    try {
        const tx = await token.blacklist(address, false);
        await tx.wait();
        showToast(`Address ${address} has been removed from the blacklist`, "success");
        updateLeaderboard();
    } catch (err) {
        decodeAndShowError(err.message);
    }
};


document.getElementById("clearBlacklist").onclick = async () => {
    try {
        const tx = await token.clearBlacklist();
        await tx.wait();
        showToast("Blacklist cleared", "success");
        updateLeaderboard();
    } catch (err) {
        decodeAndShowError(err.message);
    }
};