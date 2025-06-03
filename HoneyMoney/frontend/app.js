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
  "function getContractAddress() view returns (address)",
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
  "0x" +
  Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

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
  const latest = await provider.getBlockNumber(); // real height
  const blocks = [];

  for (let i = 0; i <= latest; i++) {
    blocks.push(
      await provider.send("eth_getBlockByNumber", [
        ethers.utils.hexValue(i),
        true,
      ])
    );
  }

  console.log("Loaded blocks: ", blocks.length, "latest block number=", latest);
  renderBlockchain(blocks);
};

/* -----------------------------------------------------------------
   Render blocks as a Bootstrap-5 carousel, two blocks per slide
   -----------------------------------------------------------------*/
const renderBlockchain = (blocks) => {
  /* -------- 1.  grab the carousel body and wipe previous slides --- */
  const carouselInner = document.querySelector(
    "#blockchainCarousel .carousel-inner"
  );
  carouselInner.innerHTML = "";

  /* -------- 2. helper – create ONE <div class="block"> card ------- */
  const buildCard = (block) => {
    const div = document.createElement("div");
    div.className = "block p-3 border rounded bg-light";

    const bn = parseInt(block.number, 16);
    const timestamp = new Date(
      parseInt(block.timestamp, 16) * 1_000
    ).toISOString();

    // simple decode of the *first* tx, same as before
    let fn = "N/A",
      from = "N/A",
      to = "N/A";
    if (block.transactions?.length) {
      const tx = block.transactions[0];
      from = tx.from;
      to = tx.to;
      try {
        fn = new ethers.utils.Interface(tokenABI).parseTransaction({
          data: tx.input,
          value: tx.value,
        }).name;
      } catch (_) {
        fn = "Constructor";
      }
    }

    div.innerHTML = `
      <div><label>Block #:</label>
           <input class="form-control form-control-sm mb-2 block-number"
                  value="${bn}"></div>
      <div><label>Timestamp:</label>
           <input class="form-control form-control-sm mb-2 timestamp"
                  value="${timestamp}"></div>
      <div><label>Miner:</label>
           <input class="form-control form-control-sm mb-2 miner"
                  value="${block.miner}"></div>
      <div><label>Parent Hash:</label>
           <input class="form-control form-control-sm mb-2 parent-hash bg-warning"
                  value="${block.parentHash}"></div>
      <div><label>Blockchain Hash:</label>
           <input class="form-control form-control-sm mb-2 hash bg-warning"
                  value="${block.hash || "N/A"}"></div>

      <div class="mt-2"><strong>Decoded Transaction:</strong></div>
      <div><label>Function:</label>
           <input class="form-control form-control-sm mb-2"
                  value="${fn}"></div>
      <div><label>From:</label>
           <input class="form-control form-control-sm mb-2"
                  value="${from}"></div>
      <div><label>To (Contract):</label>
           <input class="form-control form-control-sm mb-2"
                  value="${to}"></div>`;
    return div;
  };

  /* -------- 3. chunk blocks array → slides (2 per slide) ---------- */
  for (let i = 0; i < blocks.length; i += 2) {
    const slide = document.createElement("div");
    slide.className = "carousel-item" + (i === 0 ? " active" : "");

    const row = document.createElement("div");
    row.className = "d-flex flex-wrap justify-content-center blocks-row";

    const col1 = document.createElement("div");
    col1.className = "col-block";
    col1.appendChild(buildCard(blocks[i]));
    row.appendChild(col1);

    if (blocks[i + 1]) {
      const col2 = document.createElement("div");
      col2.className = "col-block";
      col2.appendChild(buildCard(blocks[i + 1]));
      row.appendChild(col2);
    }

    slide.appendChild(row);
    carouselInner.appendChild(slide);
  }

  /* -------- 4.  wiring up live-edit → re-hash / validation -------- */

  const blocksDivs = carouselInner.querySelectorAll(".block");

  // minimal header for hashing
  const headerFromCard = (div, original) => ({
    ...original,
    parentHash: div.querySelector(".parent-hash").value,
    miner: div.querySelector(".miner").value,
    number: +div.querySelector(".block-number").value,
    timestamp: Math.floor(
      new Date(div.querySelector(".timestamp").value).getTime() / 1_000
    ),
  });

  const recalculateAndValidate = async (e) => {
    const editedIdx = e
      ? [...blocksDivs].indexOf(e.currentTarget.closest(".block"))
      : -1;

    // 1. recompute *all* hashes first
    const freshHashes = [];
    for (let i = 0; i < blocksDivs.length; i++) {
      freshHashes[i] = await computeEthereumBlockHash(
        headerFromCard(blocksDivs[i], blocks[i])
      );
    }

    // 2. push new hashes into DOM from edited card onward
    if (editedIdx >= 0) {
      for (let i = editedIdx; i < blocksDivs.length; i++) {
        blocksDivs[i].querySelector(".hash").value = freshHashes[i];
      }
    }

    // 3. colour cards green/red depending on parent-hash linkage
    for (let i = 0; i < blocksDivs.length; i++) {
      const card = blocksDivs[i];

      if (i === 0) {
        // first card = genesis of view
        card.classList.remove("bg-danger");
        card.classList.add("bg-light");
        continue;
      }

      const prevHash = blocksDivs[i - 1].querySelector(".hash").value.trim();
      const parent = card.querySelector(".parent-hash").value.trim();

      if (parent !== prevHash) {
        card.classList.add("bg-danger");
        card.classList.remove("bg-light");
      } else {
        card.classList.remove("bg-danger");
        card.classList.add("bg-light");
      }
    }
  };

  // attach listeners to every <input> inside every card
  blocksDivs.forEach((div) =>
    div
      .querySelectorAll("input")
      .forEach((inp) => inp.addEventListener("input", recalculateAndValidate))
  );
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
      ? "Paused enabled"
      : "Disabled";
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

const updateContractAddress = async () => {
  try {
    const address = await token.getContractAddress();
    document.getElementById("contractAddress").innerText = address;
  } catch (err) {
    console.error("Error fetching contract address:", err);
    document.getElementById("contractAddress").innerText = "Error";
  }
};

// -------------------- ACTION HANDLERS --------------------
const handleTransaction = async (action, successMsg) => {
  try {
    const tx = await action();
    // await provider.send("evm_mine", []);
    await tx.wait();
    showToast(successMsg, "success");
    const address = await signer.getAddress();

    await updateBalance(address);
    await updateTotalSupply();
    await updateLeaderboard();
    await loadRealBlocksWithFullHeader();
    await updatePauseState();
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
    await updateContractAddress();

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
  await loadRealBlocksWithFullHeader();
  await updateContractAddress();
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
