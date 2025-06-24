import { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, Table, Badge, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { formatUnits, parseUnits } from 'ethers';
import { useWeb3 } from '../hooks/useWeb3';
import { useContracts } from '../hooks/useContracts';
import { useNotification } from '../contexts/NotificationContext';
import { useVaultAssets } from '../hooks/useVaultAssets';

const DPOTokensPage = () => {
  const { account, isConnected } = useWeb3();
  const { contractService } = useContracts();
  const { showSuccess, showError } = useNotification();

  // Vault assets hook – single source of truth for NFT positions
  const { activeLoans, isLoading: assetsLoading, error } = useVaultAssets();

  const [dpoTokens, setDpoTokens] = useState([]);

  // Trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  // Build DPO token data derived from active loans provided by useVaultAssets
  useEffect(() => {
    if (!activeLoans || activeLoans.length === 0) {
      setDpoTokens([]);
      return;
    }

    const tokens = activeLoans.map((nft) => {
      if (!nft?.position || !nft.position.totalDebt || nft.position.totalDebt.toString() === '0') {
        return null; // Shouldn't happen – activeLoans guarantees a loan exists
      }

      const loanAmountInDPSV = Number(formatUnits(nft.position.totalDebt.toString(), 18));
      const estimatedTokenSupply = loanAmountInDPSV * 1000; // Simple 1/0.001 mapping

      return {
        nft,
        position: nft.position,
        tokenSupply: estimatedTokenSupply,
        userBalance: estimatedTokenSupply, // MVP assumption: borrower holds 100%
        tokenSymbol: `DPO-${nft.contract?.symbol || 'NFT'}-${nft.tokenId}`
      };
    }).filter(Boolean);

    setDpoTokens(tokens);
  }, [activeLoans]);

  // Handle initiating a trade
  const handleOpenTradeModal = (token) => {
    setSelectedToken(token);
    setShowTradeModal(true);
    setTradeAmount('');
    setRecipientAddress('');
  };

  // Handle executing a trade
  const handleTrade = async () => {
    if (!contractService || !selectedToken || !tradeAmount || !recipientAddress) {
      showError('Missing required information');
      return;
    }

    try {
      // Validate recipient address
      if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
        showError('Invalid recipient address');
        return;
      }

      // Validate amount (input is in whole tokens)
      const amount = Number(tradeAmount);
      if (isNaN(amount) || amount <= 0 || amount > selectedToken.userBalance) {
        showError('Invalid amount');
        return;
      }

      // Convert to wei (18 decimals)
      const amountWei = parseUnits(amount.toString(), 18);

      // Execute on-chain transfer (simple ERC20 transfer for now)
      await contractService.transferDPOTokens(recipientAddress, amountWei);

      showSuccess(`Successfully traded ${tradeAmount} ${selectedToken.tokenSymbol} tokens to ${recipientAddress.substring(0, 6)}...${recipientAddress.substring(38)}`);

      // Close modal
      setShowTradeModal(false);

      // Update token balance in UI optimistically
      setDpoTokens(prev => prev.map(token => {
        if (
          token.nft.collectionAddress === selectedToken.nft.collectionAddress &&
          token.nft.tokenId === selectedToken.nft.tokenId
        ) {
          return {
            ...token,
            userBalance: token.userBalance - amount
          };
        }
        return token;
      }));
    } catch (err) {
      console.error('Error trading DPO tokens:', err);
      showError(`Failed to trade tokens: ${err.message || err}`);
    }
  };

  const calculateTokenPrice = (token) => {
    if (!token || !token.position) return 0;
    
    // For MVP, use a simple approximation based on the NFT value and loan amount
    // In a real implementation, this would be calculated more accurately
    const loanAmountInDPSV = Number(formatUnits(token.position.totalDebt.toString(), 18));
    const maxLoanInDPSV = Number(formatUnits(token.position.maxBorrow.toString(), 18));
    
    if (loanAmountInDPSV === 0 || maxLoanInDPSV === 0) return 0;
    
    // Price per token in DPSV (NFT value per token)
    return (maxLoanInDPSV / token.tokenSupply).toFixed(6);
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">DPO Tokens</h1>
      
      {!isConnected && (
        <Alert variant="warning">
          Please connect your wallet to view your DPO tokens.
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      <Card>
        <Card.Body>
          <Card.Title>About DPO Tokens</Card.Title>
          <Card.Text>
            DPO (Debt Position Ownership) tokens represent a share of the debt associated with an NFT collateral.
            When you borrow against your NFT, DPO tokens are minted. You can trade these tokens with other users,
            transferring part of the debt and its associated risk and reward.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Your DPO Token Holdings</Card.Title>
          {assetsLoading ? (
            <div className="text-center my-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading your DPO tokens...</p>
            </div>
          ) : isConnected && (
            dpoTokens.length === 0 ? (
              <Alert variant="info">
                You don't have any DPO tokens. When you borrow against your NFT collateral, DPO tokens will be minted.
              </Alert>
            ) : (
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Token Symbol</th>
                    <th>Underlying NFT</th>
                    <th>Your Balance</th>
                    <th>Total Supply</th>
                    <th>Est. Price (DPSV)</th>
                    <th>Underlying Debt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dpoTokens.map((token, index) => (
                    <tr key={index}>
                      <td>
                        <Badge bg="primary">{token.tokenSymbol}</Badge>
                      </td>
                      <td>
                        {token.nft.title || `${token.nft.contract?.symbol} #${token.nft.tokenId}`}
                      </td>
                      <td>{token.userBalance.toFixed(2)}</td>
                      <td>{token.tokenSupply.toFixed(2)}</td>
                      <td>{calculateTokenPrice(token)} DPSV</td>
                      <td>
                        {formatUnits(token.position.totalDebt.toString(), 18)} DPSV
                      </td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => handleOpenTradeModal(token)}
                        >
                          Trade
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )
          )}
        </Card.Body>
      </Card>

      {/* Trade Modal */}
      <Modal show={showTradeModal} onHide={() => setShowTradeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Trade DPO Tokens</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedToken && (
            <>
              <p>
                <strong>Token:</strong> {selectedToken.tokenSymbol}
              </p>
              <p>
                <strong>Your Balance:</strong> {selectedToken.userBalance.toFixed(2)}
              </p>
              <p>
                <strong>Est. Price:</strong> {calculateTokenPrice(selectedToken)} DPSV per token
              </p>
              
              <Form.Group className="mb-3">
                <Form.Label>Recipient Address</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="0x..." 
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Amount to Trade</Form.Label>
                <InputGroup>
                  <Form.Control 
                    type="number" 
                    placeholder="0.0" 
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    min="0.01"
                    max={selectedToken.userBalance}
                    step="0.01"
                  />
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setTradeAmount(selectedToken.userBalance.toString())}
                  >
                    Max
                  </Button>
                </InputGroup>
              </Form.Group>
              
              <Alert variant="info">
                <small>
                  Trading DPO tokens transfers a portion of the debt and its associated risk to the recipient.
                  The recipient will be responsible for this portion if liquidation occurs.
                  A 0.5% trading fee will be applied.
                </small>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTradeModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTrade}>
            Execute Trade
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DPOTokensPage; 