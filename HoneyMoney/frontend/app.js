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
  "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
];

let provider, signer, token;

// -------------------- UTILS --------------------
const showToast = (message, type = "info") => {
  const toastId = `toast-${Date.now()}`;
  const colorClass =
    {
      info: "text-bg-primary",
      success: "text-bg-success",
      error: "text-bg-danger",
      warning: "text-bg-warning",
    }[type] || "text-bg-secondary";

  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center ${colorClass}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body" style="word-wrap: break-word; overflow-wrap: break-word; max-width: 300px; white-space: normal;">
          ${message}
        </div>
      </div>
    </div>`;

  const container = document.getElementById("toast-container");
  container.insertAdjacentHTML("beforeend", toastHTML);

  const toastEl = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  setTimeout(() => toastEl.remove(), 5000);
};

const toBuffer = (hexString) => {
  hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  if (hexString.length % 2 !== 0) hexString = "0" + hexString;
  if (hexString.length === 0) return new Uint8Array(0);
  return Uint8Array.from(
    hexString.match(/.{1,2}/g).map((b) => parseInt(b, 16))
  );
};

const toHex = (buffer) =>
  "0x" + Array.from(buffer).map((b) => b.toString(16).padStart(2, "0")).join("");

const keccak256 = (data) => toHex(sha3_256.update(data).digest());

// -------------------- BLOCKCHAIN --------------------
const computeEthereumBlockHash = async (block) => {
  const header = [
    toBuffer(block.parentHash),
    toBuffer(block.sha3Uncles),
    toBuffer(block.miner),
    toBuffer(block.stateRoot),
    toBuffer(block.transactionsRoot),
    toBuffer(block.receiptsRoot),
    toBuffer(block.logsBloom),
    block.difficulty,
    block.number,
    block.gasLimit,
    block.gasUsed,
    block.timestamp,
    toBuffer(block.extraData),
    toBuffer(block.mixHash),
    toBuffer(block.nonce),
  ];

  const encodedHeader = encode(header);
  return ethers.utils.keccak256(encodedHeader);
};

const loadRealBlocksWithFullHeader = async () => {
  let blockNumber = 0;
  const blocks = [];

  while (true) {
    try {
      const hexBlockNumber = ethers.utils.hexValue(blockNumber);
      const block = await provider.send("eth_getBlockByNumber", [hexBlockNumber, true]);
      if (!block || !block.hash) {
        console.error(`Invalid block #: ${blockNumber}`, block);
        break;
      }
      blocks.push(block);
      blockNumber++;
    } catch (e) {
        console.error("Error fetching block:", e);
        break;
    }
  }

  const latestBlockNumber = await provider.getBlockNumber();
  console.log("Current block number:", latestBlockNumber);

  console.log("Loaded blocks:", blocks);
  renderBlockchain(blocks);
};

const renderBlockchain = (blocks) => {
  const container = document.getElementById("blockchain-container");
  container.innerHTML = "";

blocks.forEach((block, idx) => {
  const blockDiv = document.createElement("div");
  blockDiv.className = "block p-3 mb-3 border rounded bg-light";

  const blockNumber = parseInt(block.number, 16);
  const timestamp = new Date(parseInt(block.timestamp, 16) * 1000).toISOString();

  // Parse transaction data (like in your earlier code)
  let functionName = "N/A";
  let from = "N/A";
  let to = "N/A";
  if (block.transactions && block.transactions.length > 0) {
    const tx = block.transactions[0];
    from = tx.from;
    to = tx.to;
    const iface = new ethers.utils.Interface(tokenABI);
    try {
      const parsedTx = iface.parseTransaction({
        data: tx.input,
        value: tx.value,
      });
      functionName = parsedTx.name;
    } catch (err) {
      functionName = "Unknown or Constructor";
    }
  }

  blockDiv.innerHTML = `
    <div><label>Block #:</label><input class="form-control form-control-sm mb-2 block-number" value="${blockNumber}"></div>
    <div><label>Timestamp:</label><input class="form-control form-control-sm mb-2 timestamp" value="${timestamp}"></div>
    <div><label>Miner:</label><input class="form-control form-control-sm mb-2 miner" value="${block.miner}"></div>
    <div><label>Parent Hash:</label><input class="form-control form-control-sm mb-2 parent-hash" value="${block.parentHash}"></div>
    <div><label>Transactions Count:</label><input class="form-control form-control-sm mb-2" value="${block.transactions.length}"></div>
    <div><label>Blockchain Hash:</label><input class="form-control form-control-sm mb-2 hash" value="${block.hash || "N/A"}"></div>
    <div class="mt-2"><strong>Decoded Transaction:</strong></div>
    <div><label>Function:</label><input class="form-control form-control-sm mb-2" value="${functionName}"></div>
    <div><label>From:</label><input class="form-control form-control-sm mb-2" value="${from}"></div>
    <div><label>To (Contract):</label><input class="form-control form-control-sm mb-2" value="${to}"></div>
  `;

  container.appendChild(blockDiv);
});


  const blocksDivs = container.querySelectorAll(".block");

  const recalculateAndValidate = async () => {
    let previousHash = null;

    for (let i = 0; i < blocksDivs.length; i++) {
      const blockDiv = blocksDivs[i];
      const parentHashInput = blockDiv.querySelector(".parent-hash");
      const hashInput = blockDiv.querySelector(".hash");
      const minerInput = blockDiv.querySelector(".miner");
      const timestampInput = blockDiv.querySelector(".timestamp");
      const blockNumberInput = blockDiv.querySelector(".block-number");
      const nonceInput = blockDiv.querySelector(".nonce");
      const extraDataInput = blockDiv.querySelector(".extra-data");
      const gasLimitInput = blockDiv.querySelector(".gas-limit");

      const updatedBlock = {
        ...blocks[i], // fallback for non-editable fields
        parentHash: parentHashInput.value,
        miner: minerInput.value,
        number: parseInt(blockNumberInput.value),
        timestamp: Math.floor(new Date(timestampInput.value).getTime() / 1000),
        nonce: nonceInput.value,
        extraData: extraDataInput.value,
        gasLimit: gasLimitInput.value,
      };

      const recalculatedHash = await computeEthereumBlockHash(updatedBlock);
      hashInput.value = recalculatedHash;
      previousHash = recalculatedHash;

      // Update next block's parentHash
      const nextBlockDiv = blocksDivs[i + 1];
      if (nextBlockDiv) {
        const nextParentHashInput = nextBlockDiv.querySelector(".parent-hash");
        if (nextParentHashInput.value !== previousHash) {
          nextParentHashInput.value = previousHash;
        }
      }
    }

    // Validation phase: check if each block's parentHash matches previous block's hash
    for (let i = 1; i < blocksDivs.length; i++) {
      const currentBlockDiv = blocksDivs[i];
      const expectedParentHash = blocksDivs[i - 1].querySelector(".hash").value;
      const actualParentHash = currentBlockDiv.querySelector(".parent-hash").value;

      if (actualParentHash !== expectedParentHash) {
        currentBlockDiv.style.borderColor = "red";
      } else {
        currentBlockDiv.style.borderColor = "";
      }
    }
  };

  // Attach event listeners to inputs
  blocksDivs.forEach((blockDiv) => {
    const inputs = blockDiv.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("input", recalculateAndValidate);
    });
  });
};


// -------------------- STATE UPDATES --------------------
const updateTotalSupply = async () => {
  try {
    const rawSupply = await token.totalSupply();
    document.getElementById("totalSupply").innerText = parseFloat(
      ethers.utils.formatUnits(rawSupply, 18)
    ).toFixed(4);
  } catch (err) {
    console.error("Error fetching total supply:", err);
    document.getElementById("totalSupply").innerText = "Error";
  }
};

const updateContractOwner = async () => {
  try {
    const owner = await token.getOwner();
    document.getElementById("contractOwner").innerText = owner;
  } catch (err) {
    console.error("Error fetching contract owner:", err);
    document.getElementById("contractOwner").innerText = "Error";
  }
};

const updatePauseState = async () => {
  try {
    const paused = await token.isPaused();
    document.getElementById("pauseState").innerText = paused
      ? "Paused"
      : "Active";
    document.getElementById("togglePause").innerText = paused
      ? "Unpause Contract"
      : "Pause Contract";
  } catch (err) {
    console.error("Error fetching pause state:", err);
    document.getElementById("pauseState").innerText = "Error";
  }
};

const updateBalance = async (address) => {
  try {
    const rawBalance = await token.balanceOf(address);
    document.getElementById("balance").innerText = parseFloat(
      ethers.utils.formatUnits(rawBalance, 18)
    ).toFixed(4);
  } catch (err) {
    console.error("Error fetching balance:", err);
    document.getElementById("balance").innerText = "Error";
  }
};

const updateLeaderboard = async () => {
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
          isBlacklisted,
        };
      } catch (err) {
        console.error("Error fetching balance for", address, err);
        return { address, balance: "UNKNOWN", isBlacklisted: false };
      }
    })
  );

  balances.sort((a, b) => b.balance - a.balance);
  leaderboardBody.innerHTML = "";
  balances.forEach((entry, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td class="text-monospace ${entry.isBlacklisted ? "text-danger" : ""}">${
      entry.address
    }</td>
      <td>${entry.balance.toFixed(4)}</td>`;
    leaderboardBody.appendChild(row);
  });
};

// -------------------- ACTION HANDLERS --------------------
const handleTransaction = async (action, successMsg) => {
  try {
    const tx = await action();
    await tx.wait();
    showToast(successMsg, "success");
    const address = await signer.getAddress();

    await updateBalance(address);
    await updateTotalSupply();
    await updateLeaderboard();
    await loadRealBlocksWithFullHeader();
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
};

// Initialize App
document.addEventListener("DOMContentLoaded", async () => {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    token = new ethers.Contract(tokenAddress, tokenABI, signer);

    const address = await signer.getAddress();
    document.getElementById("wallet").innerText = address;

    await updateTotalSupply();
    await updateContractOwner();
    await updatePauseState();
    await updateBalance(address);
    await updateLeaderboard();
    await loadRealBlocksWithFullHeader();

    document.getElementById("connect").style.display = "none";
  } else {
    showToast("Metamask not detected!", "error");
  }
});

// Buttons
document.getElementById("connect").onclick = async () => {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  signer = provider.getSigner();
  token = new ethers.Contract(tokenAddress, tokenABI, signer);

  const address = await signer.getAddress();
  document.getElementById("wallet").innerText = address;

  await updateTotalSupply();
  await updateContractOwner();
  await updatePauseState();
  await updateBalance(address);
  await updateLeaderboard();
};

document.getElementById("togglePause").onclick = () =>
  handleTransaction(() => token.togglePause(), "Contract pause state toggled.");

document.getElementById("send").onclick = async () => {
  const recipient = document.getElementById("recipient").value.trim();
  const amount = document.getElementById("amount").value.trim();

  if (!ethers.utils.isAddress(recipient))
    return showToast("Invalid recipient address!", "error");
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
    return showToast("Invalid amount!", "error");

  await handleTransaction(
    () => token.transfer(recipient, ethers.utils.parseUnits(amount, 18)),
    `Sent ${amount} tokens to ${recipient}.`
  );
};

document.getElementById("mint").onclick = async () => {
  const to =
    document.getElementById("mintTo").value.trim() ||
    (await signer.getAddress());
  const amount = document.getElementById("mintAmount").value.trim();

  if (!ethers.utils.isAddress(to))
    return showToast("Invalid mint address!", "error");
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
    return showToast("Invalid amount!", "error");

  await handleTransaction(
    () => token.mint(to, ethers.utils.parseUnits(amount, 18)),
    `Minted ${amount} tokens to ${to}.`
  );
};

document.getElementById("burn").onclick = async () => {
  const from =
    document.getElementById("burnFrom").value.trim() ||
    (await signer.getAddress());
  const amount = document.getElementById("burnAmount").value.trim();

  if (!ethers.utils.isAddress(from))
    return showToast("Invalid burn address!", "error");
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
    return showToast("Invalid amount!", "error");

  await handleTransaction(
    () => token.burn(from, ethers.utils.parseUnits(amount, 18)),
    `Burned ${amount} tokens from ${from}.`
  );
};

document.getElementById("blacklist").onclick = async () => {
  const address = document.getElementById("blacklistAddress").value.trim();
  if (!ethers.utils.isAddress(address))
    return showToast("Invalid address!", "error");

  await handleTransaction(
    () => token.blacklist(address, true),
    `Blacklisted address ${address}.`
  );
};

document.getElementById("unblacklist").onclick = async () => {
  const address = document.getElementById("blacklistAddress").value.trim();
  if (!ethers.utils.isAddress(address))
    return showToast("Invalid address!", "error");

  await handleTransaction(
    () => token.blacklist(address, false),
    `Unblacklisted address ${address}.`
  );
};

document.getElementById("clearBlacklist").onclick = () =>
  handleTransaction(() => token.clearBlacklist(), "Blacklist cleared.");
