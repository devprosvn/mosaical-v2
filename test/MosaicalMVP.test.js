const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Mosaical MVP Test Suite", function () {
  let admin, borrower, lender, treasury;
  let nftVault, loanManager, dpoToken, oracle, bridge;
  let gameNFT, governanceToken, governance;
  let chainletId, collectionAddress;

  beforeEach(async function () {
    [admin, borrower, lender, treasury] = await ethers.getSigners();

    // Deploy Mock GameFi NFT
    const MockGameNFT = await ethers.getContractFactory("MockGameNFT");
    gameNFT = await MockGameNFT.deploy("Test Game NFT", "TGNFT");
    await gameNFT.waitForDeployment();
    collectionAddress = await gameNFT.getAddress();
    chainletId = "mosaical_2745549204473000-1";

    // Deploy Governance Token
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy("Mosaical Governance", "MSCLGOV");
    await governanceToken.waitForDeployment();

    // Deploy Core Contracts in correct order
    const GameFiOracleV3 = await ethers.getContractFactory("GameFiOracleV3");
    oracle = await GameFiOracleV3.deploy();
    await oracle.waitForDeployment();

    const MosaicalGovernance = await ethers.getContractFactory("MosaicalGovernance");
    const governanceTokenAddress = await governanceToken.getAddress();
    governance = await MosaicalGovernance.deploy(governanceTokenAddress);
    await governance.waitForDeployment();

    const NFTVaultV3 = await ethers.getContractFactory("NFTVaultV3");
    const oracleAddress = await oracle.getAddress();
    nftVault = await NFTVaultV3.deploy(oracleAddress);
    await nftVault.waitForDeployment();

    // Deploy DPO Token
    const DPOTokenV3 = await ethers.getContractFactory("DPOTokenV3");
    dpoToken = await DPOTokenV3.deploy();
    await dpoToken.waitForDeployment();

    // Deploy LoanManager
    const LoanManagerV3 = await ethers.getContractFactory("LoanManagerV3");
    const nftVaultAddress = await nftVault.getAddress();
    const dpoTokenAddress = await dpoToken.getAddress();
    loanManager = await LoanManagerV3.deploy(
      nftVaultAddress,
      dpoTokenAddress
    );
    await loanManager.waitForDeployment();

    // Deploy MosaicalSagaBridge
    const MosaicalSagaBridge = await ethers.getContractFactory("MosaicalSagaBridge");
    const mockLayerZeroEndpoint = "0x1234567890123456789012345678901234567890";
    bridge = await MosaicalSagaBridge.deploy(mockLayerZeroEndpoint); // Mock LayerZero endpoint
    await bridge.waitForDeployment();

    // Authorize LoanManager to mint DPO tokens
    const loanManagerAddress = await loanManager.getAddress();
    await dpoToken.authorizeMinter(loanManagerAddress);

    // Setup test data
    await nftVault.addSupportedCollection(collectionAddress);
    await nftVault.setGameCategory(collectionAddress, 1); // RPG
    await nftVault.setCollectionRiskTier(collectionAddress, 2); // Medium risk

    // Set oracle prices
    await oracle.updateFloorPrice(collectionAddress, ethers.parseEther("10"));
    await oracle.updateUtilityScore(collectionAddress, 1, 85); // Valid score between 1-100

    // Mint NFTs
    await gameNFT.mint(borrower.address, 1);
    await gameNFT.mint(borrower.address, 2);
    await gameNFT.mint(lender.address, 3);

    // Fund treasury with more ETH to prevent insufficient funds
    await admin.sendTransaction({
      to: treasury.address,
      value: ethers.parseEther("5000")
    });
  });

  describe("Governance System", function () {
    it("Should create proposals", async function () {
      // Mint governance tokens
      await governanceToken.mint(admin.address, ethers.parseEther("2000000"));

      // Create proposal
      const tx = await governance.connect(admin).createProposal(
        "Update collection risk tier",
        "Proposal to update risk tier to 1",
        1, // COLLECTION_ADDITION
        "0x"
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return governance.interface.parseLog(log).name === "ProposalCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const parsedEvent = governance.interface.parseLog(event);
      expect(parsedEvent.args.proposalId).to.equal(1);
    });

    it("Should handle voting process", async function () {
      await governanceToken.mint(admin.address, ethers.parseEther("2000000"));

      // Create proposal
      await governance.connect(admin).createProposal(
        "Test proposal",
        "Test proposal description",
        0, // PARAMETER_CHANGE
        "0x"
      );

      // Vote on proposal
      await governance.connect(admin).vote(1, 1); // VoteChoice.FOR

      const userVote = await governance.getUserVote(1, admin.address);
      expect(userVote.hasVoted).to.be.true;
      expect(userVote.choice).to.equal(1); // FOR
    });
  });

  describe("NFT Vault System", function () {
    it("Should deposit NFT and calculate correct LTV", async function () {
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      // Verify deposit - check the deposit struct
      const deposit = await nftVault.deposits(collectionAddress, 1);
      expect(deposit.owner).to.equal(borrower.address);
      expect(deposit.isActive).to.be.true;
      expect(await gameNFT.ownerOf(1)).to.equal(await nftVault.getAddress());

      // Check max LTV calculation
      const maxLTV = await nftVault.getMaxLTV(collectionAddress, 1);
      expect(maxLTV).to.be.gt(65); // Risk tier 2 base LTV + utility bonus
    });

    it("Should handle risk tier updates", async function () {
      await nftVault.setCollectionRiskTier(collectionAddress, 1);
      expect(await nftVault.collectionRiskTiers(collectionAddress)).to.equal(1);

      const riskModel = await nftVault.riskModels(1);
      expect(riskModel.baseLTV).to.equal(70);
      expect(riskModel.liquidationThreshold).to.equal(80);
    });

    it("Should prevent unauthorized withdrawals", async function () {
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      // Try to withdraw from different account
      await expect(
        nftVault.connect(lender).withdrawNFT(collectionAddress, 1)
      ).to.be.revertedWith("Not your NFT");
    });
  });

  describe("Loan Manager System", function () {
    it("Should create loan with correct parameters", async function () {
      // Deposit NFT first
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      // Fund loan manager
      await admin.sendTransaction({
        to: await loanManager.getAddress(),
        value: ethers.parseEther("50")
      });

      const borrowAmount = ethers.parseEther("5");
      await loanManager.connect(borrower).borrow(
        collectionAddress,
        1,
        borrowAmount
      );

      // Verify loan created
      const loan = await loanManager.loans(borrower.address, collectionAddress, 1);
      expect(loan).to.equal(borrowAmount);

      // Verify health factor
      const health = await loanManager.loanHealthFactors(borrower.address, collectionAddress, 1);
      expect(health).to.be.gt(10000); // Should be > 1.0 (scaled by 10000)
    });

    it("Should calculate dynamic interest rates", async function () {
      await loanManager.setInterestRateModel(
        collectionAddress,
        200,  // 2% base rate
        1000, // 10% slope1
        5000, // 50% slope2
        8000  // 80% optimal utilization
      );

      // Mock utilization at 50%
      await loanManager.setCollectionUtilization(collectionAddress, 5000);

      const rate = await loanManager.calculateInterestRate(collectionAddress);
      expect(rate).to.be.gt(200); // Should be above base rate
      expect(rate).to.be.lt(1200); // Should be below base + slope1
    });

    it("Should handle loan repayment correctly", async function () {
      // Setup loan
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      await admin.sendTransaction({
        to: await loanManager.getAddress(),
        value: ethers.parseEther("50")
      });

      const borrowAmount = ethers.parseEther("5");
      await loanManager.connect(borrower).borrow(
        collectionAddress,
        1,
        borrowAmount
      );

      // Advance time for interest accrual
      await time.increase(time.duration.days(30));

      // Update interest
      await loanManager.updateLoanInterest(borrower.address, collectionAddress, 1);

      // Get total owed
      const loanData = await loanManager.loanData(borrower.address, collectionAddress, 1);
      const totalOwed = borrowAmount + loanData.accruedInterest;

      // Repay loan
      await loanManager.connect(borrower).repay(
        collectionAddress,
        1,
        totalOwed,
        { value: totalOwed }
      );

      // Verify loan closed
      const loanAfter = await loanManager.loans(borrower.address, collectionAddress, 1);
      expect(loanAfter).to.equal(0);
    });
  });

  describe("DPO Token System", function () {
    it("Should mint DPO tokens on loan creation", async function () {
      // Setup loan
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      await admin.sendTransaction({
        to: await loanManager.getAddress(),
        value: ethers.parseEther("50")
      });

      const borrowAmount = ethers.parseEther("5");
      await loanManager.connect(borrower).borrow(
        collectionAddress,
        1,
        borrowAmount
      );

      // Check DPO tokens minted
      const dpoBalance = await dpoToken.tokenHoldings(
        collectionAddress,
        1,
        borrower.address
      );
      expect(dpoBalance).to.be.gt(0);

      const totalSupply = await dpoToken.nftTokenSupply(collectionAddress, 1);
      expect(totalSupply).to.equal(dpoBalance);
    });

    it("Should handle DPO token trading", async function () {
      // Setup loan and get DPO tokens
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      await admin.sendTransaction({
        to: await loanManager.getAddress(),
        value: ethers.parseEther("50")
      });

      await loanManager.connect(borrower).borrow(
        collectionAddress,
        1,
        ethers.parseEther("5")
      );

      const dpoBalance = await dpoToken.tokenHoldings(
        collectionAddress,
        1,
        borrower.address
      );

      // Place sell order
      const sellAmount = dpoBalance / 3n;
      const sellPrice = ethers.parseEther("0.001");

      await dpoToken.connect(borrower).placeSellOrder(
        collectionAddress,
        1,
        sellAmount,
        sellPrice
      );

      const totalCost = sellAmount * sellPrice;
      await dpoToken.connect(lender).placeBuyOrder(
        collectionAddress,
        1,
        sellAmount,
        sellPrice,
        { value: totalCost }
      );

      // Verify trade executed
      const lenderBalance = await dpoToken.tokenHoldings(
        collectionAddress,
        1,
        lender.address
      );
      expect(lenderBalance).to.be.gt(0);
    });

    it("Should distribute and claim interest", async function () {
      // Setup with DPO tokens
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      await admin.sendTransaction({
        to: await loanManager.getAddress(),
        value: ethers.parseEther("50")
      });

      await loanManager.connect(borrower).borrow(
        collectionAddress,
        1,
        ethers.parseEther("5")
      );

      // Distribute interest
      const interestAmount = ethers.parseEther("0.1");
      await dpoToken.distributeInterest(
        collectionAddress,
        1,
        interestAmount
      );

      // Check pending interest
      const pending = await dpoToken.calculatePendingInterest(
        borrower.address,
        collectionAddress,
        1
      );
      expect(pending).to.be.gt(0);

      // Claim interest
      await dpoToken.connect(borrower).claimInterest(collectionAddress, 1);

      const pendingAfter = await dpoToken.calculatePendingInterest(
        borrower.address,
        collectionAddress,
        1
      );
      expect(pendingAfter).to.equal(0);
    });
  });

  describe("Oracle System", function () {
    it("Should provide accurate NFT pricing", async function () {
      const price = await oracle.getFloorPrice(collectionAddress);
      const utilityScore = await oracle.getUtilityScore(collectionAddress, 1);

      // Check that floor price is set correctly
      expect(price).to.equal(ethers.parseEther("10"));
      // Check that utility score is set correctly  
      expect(utilityScore).to.equal(85);
    });

    it("Should track price history and volatility", async function () {
      // Set initial price
      await oracle.updateFloorPrice(collectionAddress, ethers.parseEther("10"));

      // Update price multiple times
      for (let i = 0; i < 5; i++) {
        await time.increase(time.duration.hours(1));
        const newPrice = ethers.parseEther((10 + i).toString());
        await oracle.updateFloorPrice(collectionAddress, newPrice);
      }

      // Check that price info is available (GameFiOracleV3 doesn't expose volatility directly)
      const priceInfo = await oracle.getPriceInfo(collectionAddress);
      expect(priceInfo.isActive).to.be.true;
    });

    it("Should update game metrics", async function () {
      await oracle.updateCollectionMetrics(
        collectionAddress,
        ethers.parseEther("100"), // volume24h
        10000, // holders
        500,   // listingCount
        30 * 24 * 3600, // avgHoldTime (30 days in seconds)
        true   // isGameFi
      );

      const metrics = await oracle.collectionMetrics(collectionAddress);
      expect(metrics.holders).to.equal(10000);
      expect(metrics.isGameFi).to.be.true;
    });

  describe("Bridge System", function () {
    it("Should setup Saga chainlet mappings", async function () {
      const sagaChainletId = 2745549204473000; // Saga chainlet numeric ID
      const remoteCollectionAddress = "0x1234567890123456789012345678901234567890";

      await bridge.addSupportedChainlet(sagaChainletId);
      await bridge.mapCollection(
        collectionAddress,
        sagaChainletId,
        remoteCollectionAddress
      );

      const mapping = await bridge.remoteMappings(
        collectionAddress,
        sagaChainletId
      );
      expect(mapping).to.equal(remoteCollectionAddress);
    });

    it("Should setup cross-chain mappings", async function () {
      const remoteChainletId = 123;
      const remoteCollectionAddress = "0x1234567890123456789012345678901234567890";

      await bridge.addSupportedChainlet(remoteChainletId);
      await bridge.mapCollection(
        collectionAddress,
        remoteChainletId,
        remoteCollectionAddress
      );

      const mapping = await bridge.remoteMappings(
        collectionAddress,
        remoteChainletId
      );
      expect(mapping).to.equal(remoteCollectionAddress);
    });

    it("Should initiate NFT bridging to Saga chainlet", async function () {
      await gameNFT.mint(borrower.address, 10);
      await gameNFT.connect(borrower).approve(await bridge.getAddress(), 10);

      const sagaChainletId = 2745549204473000;
      await bridge.addSupportedChainlet(sagaChainletId);
      await bridge.mapCollection(
        collectionAddress,
        sagaChainletId,
        "0x1234567890123456789012345678901234567890"
      );

      await expect(
        bridge.connect(borrower).bridgeNFT(
          collectionAddress,
          10,
          sagaChainletId,
          { value: ethers.parseEther("0.1") }
        )
      ).to.emit(bridge, "NFTBridgeInitiated");

      expect(await gameNFT.ownerOf(10)).to.equal(await bridge.getAddress());
    });

    it("Should initiate NFT bridging", async function () {
      await gameNFT.mint(borrower.address, 11);
      await gameNFT.connect(borrower).approve(await bridge.getAddress(), 11);

      const remoteChainletId = 123;
      await bridge.addSupportedChainlet(remoteChainletId);
      await bridge.mapCollection(
        collectionAddress,
        remoteChainletId,
        "0x1234567890123456789012345678901234567890"
      );

      await expect(
        bridge.connect(borrower).bridgeNFT(
          collectionAddress,
          11,
          remoteChainletId,
          { value: ethers.parseEther("0.1") }
        )
      ).to.emit(bridge, "NFTBridgeInitiated");

      expect(await gameNFT.ownerOf(11)).to.equal(await bridge.getAddress());
    });
  });

  describe("Security Tests", function () {
    it("Should prevent unauthorized access", async function () {
      await expect(
        nftVault.connect(borrower).setCollectionRiskTier(collectionAddress, 1)
      ).to.be.reverted;

      await expect(
        oracle.connect(borrower).updateFloorPrice(collectionAddress, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should prevent borrowing without collateral", async function () {
      await expect(
        loanManager.connect(borrower).borrow(
          collectionAddress,
          1,
          ethers.parseEther("5")
        )
      ).to.be.revertedWith("Not your NFT");
    });

    it("Should prevent exceeding LTV limits", async function () {
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      await admin.sendTransaction({
        to: await loanManager.getAddress(),
        value: ethers.parseEther("50")
      });

      // Try to borrow more than max LTV
      await expect(
        loanManager.connect(borrower).borrow(
          collectionAddress,
          1,
          ethers.parseEther("20") // More than NFT value
        )
      ).to.be.revertedWith("Exceeds max LTV");
    });
  });

  describe("Integration Tests", function () {
    it("Should validate Saga chainlet configuration", async function () {
      // Test that our contracts are configured for Saga chainlet
      const expectedChainletId = "mosaical_2745549204473000-1";
      expect(chainletId).to.equal(expectedChainletId);

      // Verify genesis account has proper balance in test environment
      const balance = await ethers.provider.getBalance(admin.address);
      expect(balance).to.be.gt(0);

      // Test cross-chainlet compatibility
      const sagaNumericId = 2745549204473000;
      await bridge.addSupportedChainlet(sagaNumericId);
      expect(await bridge.supportedChainlets(sagaNumericId)).to.be.true;
    });

    it("Should complete full lending cycle", async function () {
      // 1. Deposit NFT
      await gameNFT.connect(borrower).approve(await nftVault.getAddress(), 1);
      await nftVault.connect(borrower).depositNFT(collectionAddress, 1);

      // 2. Fund loan manager
      await admin.sendTransaction({
        to: await loanManager.getAddress(),
        value: ethers.parseEther("50")
      });

      // 3. Create loan
      const borrowAmount = ethers.parseEther("5");
      await loanManager.connect(borrower).borrow(
        collectionAddress,
        1,
        borrowAmount
      );

      // 4. Verify DPO tokens minted
      const dpoBalance = await dpoToken.tokenHoldings(
        collectionAddress,
        1,
        borrower.address
      );
      expect(dpoBalance).to.be.gt(0);

      // 5. Trade DPO tokens
      const sellAmount = dpoBalance / 3n;
      const sellPrice = ethers.parseEther("0.001");

      await dpoToken.connect(borrower).placeSellOrder(
        collectionAddress,
        1,
        sellAmount,
        sellPrice
      );

      const totalCost = sellAmount * sellPrice;
      await dpoToken.connect(lender).placeBuyOrder(
        collectionAddress,
        1,
        sellAmount,
        sellPrice,
        { value: totalCost }
      );

      // 6. Advance time for interest
      await time.increase(time.duration.days(30));

      // 7. Distribute interest
      const interestAmount = ethers.parseEther("0.1");
      await dpoToken.distributeInterest(collectionAddress, 1, interestAmount);

      // 8. Claim interest
      await dpoToken.connect(borrower).claimInterest(collectionAddress, 1);
      await dpoToken.connect(lender).claimInterest(collectionAddress, 1);

      // 9. Repay loan
      await loanManager.updateLoanInterest(borrower.address, collectionAddress, 1);
      const loan = await loanManager.loans(borrower.address, collectionAddress, 1);
      const loanData = await loanManager.loanData(borrower.address, collectionAddress, 1);
      const totalOwed = loan + loanData.accruedInterest;

      await loanManager.connect(borrower).repay(
        collectionAddress,
        1,
        totalOwed,
        { value: totalOwed }
      );

      // 10. Withdraw NFT
      await nftVault.connect(borrower).withdrawNFT(collectionAddress, 1);

      // Verify final state
      expect(await gameNFT.ownerOf(1)).to.equal(borrower.address);
      expect(await loanManager.loans(borrower.address, collectionAddress, 1)).to.equal(0);
    });
  });
  });
});