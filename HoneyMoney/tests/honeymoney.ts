import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("HoneyMoney", function () {
  async function deployHoneyMoneyFixture() {
    const initialSupply = 1000000; // 1 million tokens

    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const HoneyMoney = await ethers.getContractFactory("HoneyMoney");
    const honeyMoney = await HoneyMoney.deploy(initialSupply);

    return { honeyMoney, owner, addr1, addr2, addr3, initialSupply };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { honeyMoney, owner } = await loadFixture(deployHoneyMoneyFixture);

      expect(await honeyMoney.getOwner()).to.equal(owner.address);
      expect(await honeyMoney.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { honeyMoney, owner, initialSupply } = await loadFixture(deployHoneyMoneyFixture);

      const ownerBalance = await honeyMoney.balanceOf(owner.address);
      expect(await honeyMoney.totalSupply()).to.equal(ownerBalance);
      
      // Check that initial supply is minted with 18 decimals
      const expectedSupply = BigInt(initialSupply) * BigInt(10 ** 18);
      expect(await honeyMoney.totalSupply()).to.equal(expectedSupply);
    });

    it("Should have correct token details", async function () {
      const { honeyMoney } = await loadFixture(deployHoneyMoneyFixture);

      expect(await honeyMoney.name()).to.equal("HoneyMoney");
      expect(await honeyMoney.symbol()).to.equal("BEE");
      expect(await honeyMoney.decimals()).to.equal(18);
    });

    it("Should start unpaused", async function () {
      const { honeyMoney } = await loadFixture(deployHoneyMoneyFixture);

      expect(await honeyMoney.isPaused()).to.equal(false);
      expect(await honeyMoney.paused()).to.equal(false);
    });

    it("Should return correct contract address", async function () {
      const { honeyMoney } = await loadFixture(deployHoneyMoneyFixture);

      expect(await honeyMoney.getContractAddress()).to.equal(await honeyMoney.getAddress());
    });
  });

  describe("Admin Functions", function () {
    describe("Pause/Unpause", function () {
      it("Should allow owner to pause and unpause", async function () {
        const { honeyMoney, owner } = await loadFixture(deployHoneyMoneyFixture);

        // Pause the contract
        await honeyMoney.connect(owner).togglePause();
        expect(await honeyMoney.isPaused()).to.equal(true);

        // Unpause the contract
        await honeyMoney.connect(owner).togglePause();
        expect(await honeyMoney.isPaused()).to.equal(false);
      });

      it("Should not allow non-owner to pause", async function () {
        const { honeyMoney, addr1 } = await loadFixture(deployHoneyMoneyFixture);

        await expect(honeyMoney.connect(addr1).togglePause())
          .to.be.revertedWith("Only owner can call this function");
      });
    });

    describe("Minting", function () {
      it("Should allow owner to mint tokens", async function () {
        const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

        const mintAmount = ethers.parseEther("1000");
        const initialBalance = await honeyMoney.balanceOf(addr1.address);

        await honeyMoney.connect(owner).mint(addr1.address, mintAmount);

        expect(await honeyMoney.balanceOf(addr1.address)).to.equal(initialBalance + mintAmount);
      });

      it("Should not allow non-owner to mint", async function () {
        const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

        const mintAmount = ethers.parseEther("1000");

        await expect(honeyMoney.connect(addr1).mint(addr2.address, mintAmount))
          .to.be.revertedWith("Only owner can call this function");
      });

      it("Should not allow minting when paused", async function () {
        const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

        await honeyMoney.connect(owner).togglePause();
        const mintAmount = ethers.parseEther("1000");

        await expect(honeyMoney.connect(owner).mint(addr1.address, mintAmount))
          .to.be.revertedWith("Contract is paused");
      });

      it("Should not allow minting to blacklisted address", async function () {
        const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

        // Blacklist addr1 from owner's perspective
        await honeyMoney.connect(owner).blacklist(addr1.address, true);
        const mintAmount = ethers.parseEther("1000");

        await expect(honeyMoney.connect(owner).mint(addr1.address, mintAmount))
          .to.be.revertedWith("Cannot mint to a blacklisted address");
      });
    });

    describe("Burning", function () {
      it("Should allow owner to burn tokens", async function () {
        const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

        // First mint some tokens to addr1
        const mintAmount = ethers.parseEther("1000");
        await honeyMoney.connect(owner).mint(addr1.address, mintAmount);

        const burnAmount = ethers.parseEther("500");
        const balanceBeforeBurn = await honeyMoney.balanceOf(addr1.address);

        await honeyMoney.connect(owner).burn(addr1.address, burnAmount);

        expect(await honeyMoney.balanceOf(addr1.address)).to.equal(balanceBeforeBurn - burnAmount);
      });

      it("Should not allow non-owner to burn", async function () {
        const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

        const burnAmount = ethers.parseEther("100");

        await expect(honeyMoney.connect(addr1).burn(addr2.address, burnAmount))
          .to.be.revertedWith("Only owner can call this function");
      });

      it("Should not allow burning when paused", async function () {
        const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

        await honeyMoney.connect(owner).togglePause();
        const burnAmount = ethers.parseEther("100");

        await expect(honeyMoney.connect(owner).burn(addr1.address, burnAmount))
          .to.be.revertedWith("Contract is paused");
      });

      it("Should not allow burning from blacklisted address", async function () {
        const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

        // Blacklist addr1 from owner's perspective
        await honeyMoney.connect(owner).blacklist(addr1.address, true);
        const burnAmount = ethers.parseEther("100");

        await expect(honeyMoney.connect(owner).burn(addr1.address, burnAmount))
          .to.be.revertedWith("Cannot burn from a blacklisted address");
      });
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { honeyMoney, owner, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // Transfer tokens from owner to addr1
      const transferAmount = ethers.parseEther("1000");
      await honeyMoney.connect(owner).transfer(addr1.address, transferAmount);

      expect(await honeyMoney.balanceOf(addr1.address)).to.equal(transferAmount);

      // Transfer from addr1 to addr2
      const secondTransferAmount = ethers.parseEther("500");
      await honeyMoney.connect(addr1).transfer(addr2.address, secondTransferAmount);

      expect(await honeyMoney.balanceOf(addr2.address)).to.equal(secondTransferAmount);
      expect(await honeyMoney.balanceOf(addr1.address)).to.equal(transferAmount - secondTransferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      const transferAmount = ethers.parseEther("1000");

      await expect(honeyMoney.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should not allow transfers when paused", async function () {
      const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

      await honeyMoney.connect(owner).togglePause();
      const transferAmount = ethers.parseEther("1000");

      await expect(honeyMoney.connect(owner).transfer(addr1.address, transferAmount))
        .to.be.revertedWith("Contract is paused");
    });

    it("Should not allow transfers from blacklisted sender", async function () {
      const { honeyMoney, owner, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // Give addr1 some tokens first
      await honeyMoney.connect(owner).transfer(addr1.address, ethers.parseEther("1000"));

      // Blacklist addr1 from addr1's own perspective (sender blacklists themselves)
      await honeyMoney.connect(addr1).blacklist(addr1.address, true);

      const transferAmount = ethers.parseEther("500");

      await expect(honeyMoney.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWith("Sender is blacklisted");
    });

    it("Should not allow transfers to blacklisted recipient", async function () {
      const { honeyMoney, owner, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // Give addr1 some tokens first
      await honeyMoney.connect(owner).transfer(addr1.address, ethers.parseEther("1000"));

      // Blacklist addr2 from addr1's perspective (sender blacklists recipient)
      await honeyMoney.connect(addr1).blacklist(addr2.address, true);

      const transferAmount = ethers.parseEther("500");

      await expect(honeyMoney.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWith("Recipient is blacklisted");
    });
  });

  describe("Blacklisting", function () {
    it("Should allow users to blacklist addresses", async function () {
      const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // Initially not blacklisted
      expect(await honeyMoney.connect(addr1).isBlacklisted(addr2.address)).to.equal(false);

      // Blacklist addr2 from addr1's perspective
      await expect(honeyMoney.connect(addr1).blacklist(addr2.address, true))
        .to.emit(honeyMoney, "Blacklisted")
        .withArgs(addr2.address, true);

      expect(await honeyMoney.connect(addr1).isBlacklisted(addr2.address)).to.equal(true);
    });

    it("Should allow users to unblacklist addresses", async function () {
      const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // First blacklist
      await honeyMoney.connect(addr1).blacklist(addr2.address, true);
      expect(await honeyMoney.connect(addr1).isBlacklisted(addr2.address)).to.equal(true);

      // Then unblacklist
      await expect(honeyMoney.connect(addr1).blacklist(addr2.address, false))
        .to.emit(honeyMoney, "Blacklisted")
        .withArgs(addr2.address, false);

      expect(await honeyMoney.connect(addr1).isBlacklisted(addr2.address)).to.equal(false);
    });

    it("Should not allow blacklisting already blacklisted address", async function () {
      const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // First blacklist
      await honeyMoney.connect(addr1).blacklist(addr2.address, true);

      // Try to blacklist again
      await expect(honeyMoney.connect(addr1).blacklist(addr2.address, true))
        .to.be.revertedWith("Address is already blacklisted");
    });

    it("Should not allow unblacklisting non-blacklisted address", async function () {
      const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // Try to unblacklist without blacklisting first
      await expect(honeyMoney.connect(addr1).blacklist(addr2.address, false))
        .to.be.revertedWith("Address is not blacklisted");
    });

    it("Should not allow blacklisting when paused", async function () {
      const { honeyMoney, owner, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      await honeyMoney.connect(owner).togglePause();

      await expect(honeyMoney.connect(addr1).blacklist(addr2.address, true))
        .to.be.revertedWith("Contract is paused");
    });

    it("Should return correct blacklisted addresses", async function () {
      const { honeyMoney, addr1, addr2, addr3 } = await loadFixture(deployHoneyMoneyFixture);

      // Blacklist multiple addresses
      await honeyMoney.connect(addr1).blacklist(addr2.address, true);
      await honeyMoney.connect(addr1).blacklist(addr3.address, true);

      const blacklistedAddresses = await honeyMoney.connect(addr1).getBlacklistedAddresses();
      expect(blacklistedAddresses).to.have.lengthOf(2);
      expect(blacklistedAddresses).to.include(addr2.address);
      expect(blacklistedAddresses).to.include(addr3.address);
    });

    it("Should clear blacklist correctly", async function () {
      const { honeyMoney, addr1, addr2, addr3 } = await loadFixture(deployHoneyMoneyFixture);

      // Blacklist multiple addresses
      await honeyMoney.connect(addr1).blacklist(addr2.address, true);
      await honeyMoney.connect(addr1).blacklist(addr3.address, true);

      // Clear blacklist
      await honeyMoney.connect(addr1).clearBlacklist();

      const blacklistedAddresses = await honeyMoney.connect(addr1).getBlacklistedAddresses();
      expect(blacklistedAddresses).to.have.lengthOf(0);

      expect(await honeyMoney.connect(addr1).isBlacklisted(addr2.address)).to.equal(false);
      expect(await honeyMoney.connect(addr1).isBlacklisted(addr3.address)).to.equal(false);
    });

    it("Should not allow clearing blacklist when paused", async function () {
      const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

      await honeyMoney.connect(owner).togglePause();

      await expect(honeyMoney.connect(addr1).clearBlacklist())
        .to.be.revertedWith("Contract is paused");
    });

    it("Should handle blacklist independence between users", async function () {
      const { honeyMoney, addr1, addr2, addr3 } = await loadFixture(deployHoneyMoneyFixture);

      // addr1 blacklists addr3
      await honeyMoney.connect(addr1).blacklist(addr3.address, true);

      // addr2 should not see addr3 as blacklisted
      expect(await honeyMoney.connect(addr1).isBlacklisted(addr3.address)).to.equal(true);
      expect(await honeyMoney.connect(addr2).isBlacklisted(addr3.address)).to.equal(false);

      // addr2 blacklists addr3 independently
      await honeyMoney.connect(addr2).blacklist(addr3.address, true);

      // Both should see addr3 as blacklisted from their own perspective
      expect(await honeyMoney.connect(addr1).isBlacklisted(addr3.address)).to.equal(true);
      expect(await honeyMoney.connect(addr2).isBlacklisted(addr3.address)).to.equal(true);
    });
  });

  describe("Events", function () {
    it("Should emit Transfer events", async function () {
      const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

      const transferAmount = ethers.parseEther("1000");

      await expect(honeyMoney.connect(owner).transfer(addr1.address, transferAmount))
        .to.emit(honeyMoney, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Should emit Blacklisted events", async function () {
      const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // Test blacklisting event
      await expect(honeyMoney.connect(addr1).blacklist(addr2.address, true))
        .to.emit(honeyMoney, "Blacklisted")
        .withArgs(addr2.address, true);

      // Test unblacklisting event
      await expect(honeyMoney.connect(addr1).blacklist(addr2.address, false))
        .to.emit(honeyMoney, "Blacklisted")
        .withArgs(addr2.address, false);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

      await expect(honeyMoney.connect(owner).transfer(addr1.address, 0))
        .to.not.be.reverted;
    });

    it("Should handle zero amount minting", async function () {
      const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

      await expect(honeyMoney.connect(owner).mint(addr1.address, 0))
        .to.not.be.reverted;
    });

    it("Should handle zero amount burning", async function () {
      const { honeyMoney, owner, addr1 } = await loadFixture(deployHoneyMoneyFixture);

      await expect(honeyMoney.connect(owner).burn(addr1.address, 0))
        .to.not.be.reverted;
    });

    it("Should handle self-transfers", async function () {
      const { honeyMoney, owner } = await loadFixture(deployHoneyMoneyFixture);

      const transferAmount = ethers.parseEther("1000");
      const balanceBefore = await honeyMoney.balanceOf(owner.address);

      await honeyMoney.connect(owner).transfer(owner.address, transferAmount);

      expect(await honeyMoney.balanceOf(owner.address)).to.equal(balanceBefore);
    });

    it("Should handle multiple blacklist operations on same address", async function () {
      const { honeyMoney, addr1, addr2 } = await loadFixture(deployHoneyMoneyFixture);

      // Blacklist and unblacklist multiple times
      await honeyMoney.connect(addr1).blacklist(addr2.address, true);
      await honeyMoney.connect(addr1).blacklist(addr2.address, false);
      await honeyMoney.connect(addr1).blacklist(addr2.address, true);
      await honeyMoney.connect(addr1).blacklist(addr2.address, false);

      expect(await honeyMoney.connect(addr1).isBlacklisted(addr2.address)).to.equal(false);
    });
  });
});
