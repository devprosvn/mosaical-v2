import { useState } from 'react';
import { Container, Row, Col, Tabs, Tab, Card, Alert, Spinner, Modal, Form, Button } from 'react-bootstrap';
import { useWeb3 } from '../hooks/useWeb3';
import { useContracts } from '../hooks/useContracts';
import { useNotification } from '../contexts/NotificationContext';
import NFTCard from '../components/NFTCard';
import { useVaultAssets } from '../hooks/useVaultAssets';
import { parseUnits, formatUnits } from 'ethers';

const LoanPage = () => {
  const { isConnected, account } = useWeb3();
  const { contractService } = useContracts();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState('borrow');
  const [isProcessing, setIsProcessing] = useState(false);
  const [borrowModalNft, setBorrowModalNft] = useState(null);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  // Use our custom hook to get vault assets
  const { 
    availableCollateral,   // NFTs without loans (available for borrowing)
    activeLoans,           // NFTs with active loans
    isLoading, 
    error,
    refreshPosition
  } = useVaultAssets();

  // ---------- Borrow Logic ----------
  const prepareBorrow = (nft) => {
    setBorrowModalNft(nft);
    setBorrowAmount('');
    setShowBorrowModal(true);
  };

  const handleBorrow = async () => {
    if (!contractService || !borrowModalNft) return;
    try {
      setIsProcessing(true);
      const collectionAddress = borrowModalNft.collectionAddress || borrowModalNft.contract?.address;
      const tokenId = borrowModalNft.tokenId;
      const amountWei = parseUnits(borrowAmount || '0', 18);
      if (amountWei <= 0n) {
        showError('Enter valid amount');
        return;
      }
      await contractService.borrow(collectionAddress, tokenId, amountWei);
      showSuccess('Borrow successful');
      refreshPosition(collectionAddress, tokenId);
      setShowBorrowModal(false);
    } catch (err) {
      console.error('Borrow error:', err);
      showError(err.reason || err.message || 'Borrow failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Repay handler (reuse logic from VaultAssets)
  const handleRepay = async (nft) => {
    if (!contractService || !nft) {
      showError('Contract service not available');
      return;
    }

    try {
      setIsProcessing(true);
      const tokenId = nft.tokenId;
      const collectionAddress = nft.collectionAddress || nft.contract?.address;

      if (!tokenId || !collectionAddress || !account) {
        showError('Invalid NFT data');
        return;
      }

      // Get up-to-date debt (pass the connected wallet address)
      const position = await contractService.getUserPosition(account, collectionAddress, tokenId);
      const totalDebt = position.totalDebt;
      if (totalDebt === 0n) {
        showError('No debt to repay for this NFT');
        return;
      }
      const buffer = totalDebt / 1000n;
      const finalAmount = totalDebt + buffer;
      const userBalance = await contractService.getWalletBalance();
      if (userBalance < finalAmount) {
        showError('Insufficient balance to repay');
        return;
      }
      await contractService.repayLoan(collectionAddress, tokenId, finalAmount);
      showSuccess('Loan repaid');
      refreshPosition(collectionAddress, tokenId);
    } catch (err) {
      console.error('Error repaying loan:', err);
      showError(err.reason || err.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Loan Management</h1>
      
      {!isConnected && (
        <Alert variant="warning">
          Please connect your wallet to view your loans.
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
      
      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading loan data...</p>
        </div>
      ) : isConnected && (
        <Tabs 
          id="loan-tabs" 
          activeKey={activeTab} 
          onSelect={k => setActiveTab(k)}
          className="mb-4"
        >
          <Tab eventKey="borrow" title="Borrow">
            <Card>
              <Card.Body>
                <h2 className="mb-4">Available NFT Collateral</h2>
                {availableCollateral.length === 0 ? (
                  <Alert variant="info">
                    You don't have any NFTs deposited that are available for borrowing.
                    <br/>
                    Visit the Dashboard to deposit NFTs as collateral first.
                  </Alert>
                ) : (
                  <Row className="g-4">
                    {availableCollateral.map((nft) => (
                      <Col xs={12} md={6} key={`${nft.collectionAddress}-${nft.tokenId}`}>
                        <div style={{ width: '100%', aspectRatio: '3/2' }}>
                          <NFTCard 
                            nft={nft}
                            userPosition={nft.position}
                            canBorrow={true}
                            onBorrow={() => prepareBorrow(nft)}
                            isProcessing={isProcessing}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="repay" title="Repay Loans">
            <Card>
              <Card.Body>
                <h2 className="mb-4">Your Active Loans</h2>
                {activeLoans.length === 0 ? (
                  <Alert variant="info">
                    You don't have any active loans to repay.
                  </Alert>
                ) : (
                  <Row className="g-4">
                    {activeLoans.map((nft) => (
                      <Col xs={12} md={6} key={`${nft.collectionAddress}-${nft.tokenId}`}>
                        <div style={{ width: '100%', aspectRatio: '3/2' }}>
                          <NFTCard 
                            nft={nft}
                            userPosition={nft.position}
                            canRepay={true}
                            onRepay={handleRepay}
                            isProcessing={isProcessing}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}

      {/* Borrow Modal */}
      <Modal show={showBorrowModal} onHide={() => setShowBorrowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Borrow against your NFT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter amount to borrow (DPSV)</Form.Label>
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
          <Button variant="primary" onClick={handleBorrow} disabled={isProcessing || !borrowAmount}>
            {isProcessing ? 'Processing...' : 'Borrow'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LoanPage; 