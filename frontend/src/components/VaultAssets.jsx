import { useState, useMemo } from 'react';
import { Container, Row, Col, Alert, Spinner, Modal, Button, Form } from 'react-bootstrap';
import { useWeb3 } from '../hooks/useWeb3';
import { useContracts } from '../hooks/useContracts';
import { useNotification } from '../contexts/NotificationContext';
import NFTCard from './NFTCard';
import { formatUnits, parseUnits } from 'ethers';
import { useVaultAssets } from '../hooks/useVaultAssets';

const VaultAssets = ({ refreshTrigger }) => {
  const { account } = useWeb3();
  const { contractService } = useContracts();
  const { showError, showSuccess } = useNotification();
  
  // Use our custom hook
  const { 
    assets: vaultAssets, 
    userPositions, 
    isLoading, 
    error,
    refreshPosition,
    refreshAllPositions
  } = useVaultAssets(refreshTrigger);
  
  // General processing state for disabling buttons during transactions
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Borrow modal state
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [maxBorrowAmount, setMaxBorrowAmount] = useState('0');
  
  // Repay modal state
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [currentDebt, setCurrentDebt] = useState('0');

  // Track NFTs that have just been withdrawn so UI updates instantly
  const [removedKeys, setRemovedKeys] = useState(new Set());

  // Handle withdrawing an NFT
  const handleWithdrawNFT = async (nft) => {
    console.log("1️⃣ [Withdraw] Starting withdrawal with NFT:", nft);
    
    if (!contractService) {
      showError('Contract service not available');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Ensure we get the collection address correctly
      const collectionAddress = nft.collectionAddress || nft.contract?.address;
      const tokenId = nft.tokenId;
      
      console.log("2️⃣ [Withdraw] Extracted data:", { collectionAddress, tokenId });

      if (!tokenId || !collectionAddress) {
        console.error("❌ [Withdraw] Invalid NFT data:", { tokenId, collectionAddress });
        showError('Invalid NFT data');
        return;
      }
      
      const result = await contractService.withdrawNFT(collectionAddress, tokenId);
      console.log("3️⃣ [Withdraw] Withdrawal result:", result);
      
      showSuccess('NFT withdrawn successfully');
      // Remove NFT from local view immediately
      const key = `${collectionAddress}-${tokenId}`;
      setRemovedKeys(prev => new Set(prev).add(key));

      // Trigger full refresh in the background
      await refreshAllPositions();
    } catch (err) {
      console.error("❌ [Withdraw] Withdrawal error:", err);
      showError(`Failed to withdraw NFT: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Prepare for borrowing - called when user clicks "Borrow" button
  const prepareAndOpenBorrowModal = (nft) => {
    setSelectedNFT(nft);
    
    // Use the correct key format based on our updated structure
    const key = `${nft.collectionAddress || nft.contract?.address}-${nft.tokenId}`;
    const position = userPositions[key];
    
    if (position) {
      // Format max borrow amount to show in DPSV
      setMaxBorrowAmount(formatUnits(position.maxBorrow?.toString() || '0', 18));
    }
    
    setShowBorrowModal(true);
  };

  // Handle borrowing after user confirms in modal
  const handleBorrow = async () => {
    if (!contractService || !selectedNFT) {
      showError('Contract service not available');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Convert input amount (DPSV) to wei
      const amountWei = parseUnits(borrowAmount, 18);
      
      const tokenId = selectedNFT.tokenId;
      const collectionAddress = selectedNFT.collectionAddress || selectedNFT.contract?.address;
      
      if (!tokenId || !collectionAddress) {
        showError('Invalid NFT data');
        return;
      }
      
      await contractService.borrow(collectionAddress, tokenId, amountWei);
      showSuccess('Loan successfully created!');
      
      // Close modal and reset
      setShowBorrowModal(false);
      setBorrowAmount('');
      setSelectedNFT(null);
      
      // Refresh position for this NFT
      await refreshPosition(collectionAddress, tokenId);
    } catch (err) {
      console.error('Error borrowing:', err);
      showError(`Failed to borrow: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Prepare for repaying - called when user clicks "Repay Full Amount" button
  const prepareAndOpenRepayModal = (nft) => {
    setSelectedNFT(nft);
    
    const key = `${nft.collectionAddress || nft.contract?.address}-${nft.tokenId}`;
    const position = userPositions[key];
    
    if (position) {
      // Format debt amount to show in DPSV
      setCurrentDebt(formatUnits(position.totalDebt?.toString() || '0', 18));
    }
    
    setShowRepayModal(true);
  };

  // Handle repaying - called when user confirms in modal
  const handleRepay = async () => {
    if (!contractService || !selectedNFT || !account) {
      showError('Cannot proceed with repayment. Please reconnect wallet.');
      return;
    }

    setIsProcessing(true);

    try {
      const tokenId = selectedNFT.tokenId;
      const collectionAddress = selectedNFT.collectionAddress || selectedNFT.contract?.address;
      
      if (!tokenId || !collectionAddress) {
        showError('Invalid NFT data');
        setIsProcessing(false);
        return;
      }
      
      // CRITICAL: Get the most up-to-date debt amount right before sending the transaction
      // This prevents CALL_EXCEPTION errors due to interest accrual
      console.log(`Getting latest debt amount for NFT #${tokenId}...`);
      const position = await contractService.getUserPosition(account, collectionAddress, tokenId);
      const totalDebtInWei = position.totalDebt; // This is a BigInt value in wei
      
      // Add a 0.1% buffer to account for interest accrual between fetching and sending tx
      const buffer = totalDebtInWei / 1000n; // 0.1% buffer
      const finalRepaymentAmount = totalDebtInWei + buffer;

      // 🔒 Ensure the user has enough native DPSV (ETH on testnet) to cover the repayment
      const userBalanceWei = await contractService.getWalletBalance();
      if (userBalanceWei < finalRepaymentAmount) {
        showError('Insufficient wallet balance to repay this loan.');
        setIsProcessing(false);
        return;
      }

      // Check if there's any debt to repay
      if (totalDebtInWei === 0n) { // Using 0n for BigInt comparison
        showError('There is no debt to repay for this NFT.');
        setIsProcessing(false);
        return;
      }
      
      console.log(`--- Repaying Loan for NFT #${tokenId} ---`);
      console.log(`Final debt check (wei): ${totalDebtInWei.toString()}`);
      console.log(`Sending with buffer (wei): ${finalRepaymentAmount.toString()}`);
      
      // Send the transaction with the exact up-to-date debt amount
      await contractService.repayLoan(
        collectionAddress, 
        tokenId, 
        finalRepaymentAmount // Pass amount directly
      );
      
      showSuccess('Loan successfully repaid! You can now withdraw your NFT.');
      
      // Close modal and reset
      setShowRepayModal(false);
      setSelectedNFT(null);
      
      // Refresh position for this NFT
      await refreshAllPositions();
    } catch (err) {
      console.error('Error repaying loan:', err);
      showError(`Failed to repay loan: ${err.reason || err.message || 'Transaction reverted.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter assets to exclude ones withdrawn in this session
  const displayedAssets = useMemo(() => {
    return vaultAssets.filter(asset => {
      const k = `${asset.collectionAddress || asset.contract?.address}-${asset.tokenId}`;
      return !removedKeys.has(k);
    });
  }, [vaultAssets, removedKeys]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading your vault assets...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  // Show empty state
  if (!account) {
    return <Alert variant="info">Connect your wallet to view your vault assets</Alert>;
  }

  // Show empty vault state
  if (vaultAssets.length === 0) {
    return <Alert variant="info">You have no NFTs in the vault</Alert>;
  }

  return (
    <>
      {/* Use Container to ensure proper spacing and layout */}
      <Container fluid className="mt-4 px-4">
        <h3 className="mb-3">Deposited NFTs</h3>
        <p className="text-muted mb-4">These are the NFTs you've deposited into the vault as collateral.</p>
        <Row className="g-4">
          {displayedAssets.map((nft) => {
            // Use the correct key format based on our updated structure
            const key = `${nft.collectionAddress || nft.contract?.address}-${nft.tokenId}`;
            const position = userPositions[key];
            
            return (
              <Col key={key} xs={12} md={6}>
                <div style={{ width: '100%', aspectRatio: '3/2' }}>
                  <NFTCard 
                    nft={nft}
                    userPosition={position}
                    isProcessing={isProcessing}
                    canWithdraw={true}
                    canBorrow={true}
                    canRepay={true}
                    onWithdraw={handleWithdrawNFT}
                    onBorrow={prepareAndOpenBorrowModal}
                    onRepay={prepareAndOpenRepayModal}
                  />
                </div>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Borrow Modal */}
      <Modal show={showBorrowModal} onHide={() => setShowBorrowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Borrow against your NFT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Available to borrow: {maxBorrowAmount} DPSV</p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter amount to borrow (in DPSV)</Form.Label>
              <Form.Control
                type="text"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="0.0"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBorrowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleBorrow}
            disabled={!borrowAmount || parseFloat(borrowAmount) <= 0 || parseFloat(borrowAmount) > parseFloat(maxBorrowAmount) || isProcessing}
          >
            {isProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              "Borrow"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Repay Modal */}
      <Modal show={showRepayModal} onHide={() => setShowRepayModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Repay your loan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-1">You are about to repay the entire loan for <strong>NFT #{selectedNFT?.tokenId}</strong>.</p>
          <p className="text-muted">This will close the loan and allow you to withdraw your NFT.</p>
          <hr />
          <div className="text-center">
            <h5>Total Debt to Repay:</h5>
            <h3 className="text-danger">{currentDebt} DPSV</h3>
            <p className="text-muted small mt-2">
              Note: The actual amount may be slightly higher due to interest accrual.
              The exact amount will be calculated at transaction time.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRepayModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRepay}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              "Confirm and Repay Full Amount"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default VaultAssets;