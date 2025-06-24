import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Tab, Tabs, Spinner, Table } from 'react-bootstrap';
import { useWeb3 } from '../hooks/useWeb3';
import { useContracts } from '../hooks/useContracts';
import { useNotification } from '../contexts/NotificationContext';
import { parseUnits, formatUnits } from 'ethers';

const AdminPage = () => {
  const { account } = useWeb3();
  const { contractService, isLoading: isContractLoading } = useContracts();
  const { showSuccess, showError } = useNotification();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Collection form data
  const [collectionAddress, setCollectionAddress] = useState('');
  const [maxLTV, setMaxLTV] = useState('70');
  const [liquidationThreshold, setLiquidationThreshold] = useState('85');
  const [baseInterestRate, setBaseInterestRate] = useState('5');
  
  // Oracle form data
  const [oracleCollectionAddress, setOracleCollectionAddress] = useState('');
  const [floorPrice, setFloorPrice] = useState('');

  // Liquidation form data
  const [liquidationCollectionAddress, setLiquidationCollectionAddress] = useState('');
  const [liquidationTokenId, setLiquidationTokenId] = useState('');
  
  // At-risk loans data
  const [riskLoans, setRiskLoans] = useState([]);
  const [isLoadingRiskLoans, setIsLoadingRiskLoans] = useState(false);

  // DPO token form data
  const [dpoAddress, setDpoAddress] = useState('');

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!account || !contractService) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const isOwner = await contractService.isContractOwner(account);
        setIsAdmin(isOwner);
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [account, contractService]);

  // Handle adding a supported collection
  const handleAddCollection = async (e) => {
    e.preventDefault();
    
    if (!contractService) {
      showError('Contract service not available');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Convert percentages to basis points (e.g., 70% → 7000)
      const maxLTVBasisPoints = Math.round(parseFloat(maxLTV) * 100);
      const liquidationThresholdBasisPoints = Math.round(parseFloat(liquidationThreshold) * 100);
      const baseInterestRateBasisPoints = Math.round(parseFloat(baseInterestRate) * 100);
      
      await contractService.addSupportedCollection(
        collectionAddress,
        maxLTVBasisPoints,
        liquidationThresholdBasisPoints,
        baseInterestRateBasisPoints
      );
      
      showSuccess(`Collection ${collectionAddress} added successfully`);
      
      // Reset form
      setCollectionAddress('');
    } catch (error) {
      console.error('Error adding collection:', error);
      showError(`Failed to add collection: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle updating oracle floor price
  const handleUpdateFloorPrice = async (e) => {
    e.preventDefault();
    
    if (!contractService) {
      showError('Contract service not available');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Convert DPSV to wei
      const priceWei = parseUnits(floorPrice, 18);
      
      await contractService.updateFloorPrice(oracleCollectionAddress, priceWei);
      
      showSuccess(`Floor price updated for ${oracleCollectionAddress}`);
      
      // Reset form
      setOracleCollectionAddress('');
      setFloorPrice('');
    } catch (error) {
      console.error('Error updating floor price:', error);
      showError(`Failed to update floor price: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle liquidation of a loan
  const handleLiquidateLoan = async (e) => {
    e.preventDefault();
    
    if (!contractService) {
      showError('Contract service not available');
      return;
    }

    try {
      setIsProcessing(true);
      
      await contractService.liquidateLoan(liquidationCollectionAddress, liquidationTokenId);
      
      showSuccess(`Loan for NFT ${liquidationTokenId} successfully liquidated`);
      
      // Reset form
      setLiquidationCollectionAddress('');
      setLiquidationTokenId('');
      
      // Refresh at-risk loans
      fetchRiskLoans();
    } catch (error) {
      console.error('Error liquidating loan:', error);
      showError(`Failed to liquidate loan: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch loans that are at risk of liquidation
  const fetchRiskLoans = async () => {
    if (!contractService) {
      showError('Contract service not available');
      return;
    }

    try {
      setIsLoadingRiskLoans(true);
      
      // This would require a custom method in your contract service
      // that scans for loans with LTV above liquidation threshold
      const atRiskLoans = await contractService.getLoansAtRisk();
      setRiskLoans(atRiskLoans);
    } catch (error) {
      console.error('Error fetching at-risk loans:', error);
      showError(`Failed to fetch at-risk loans: ${error.message || error}`);
    } finally {
      setIsLoadingRiskLoans(false);
    }
  };

  // Load at-risk loans when the tab is selected
  const handleTabSelect = (key) => {
    if (key === 'liquidation') {
      fetchRiskLoans();
    }
  };

  // Show loading state
  if (isCheckingAdmin || isContractLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p>Checking admin access...</p>
      </Container>
    );
  }

  // Show unauthorized state
  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Unauthorized Access</Alert.Heading>
          <p>
            You do not have admin privileges to access this page.
            Please connect with an admin wallet or contact the system administrator.
          </p>
        </Alert>
      </Container>
    );
  }

  // Show admin dashboard
  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>
      
      <Tabs defaultActiveKey="collections" onSelect={handleTabSelect} className="mb-4">
        {/* Collection Management Tab */}
        <Tab eventKey="collections" title="Collection Management">
          <Card>
            <Card.Body>
              <Card.Title>Add Supported Collection</Card.Title>
              <Form onSubmit={handleAddCollection}>
                <Form.Group className="mb-3">
                  <Form.Label>Collection Address</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="0x..." 
                    value={collectionAddress}
                    onChange={(e) => setCollectionAddress(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Max LTV (%) - Maximum loan-to-value ratio</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="70" 
                    value={maxLTV}
                    onChange={(e) => setMaxLTV(e.target.value)}
                    min="1"
                    max="90"
                    required
                  />
                  <Form.Text className="text-muted">
                    Recommended: 50-70%. Higher values increase risk.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Liquidation Threshold (%)</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="85" 
                    value={liquidationThreshold}
                    onChange={(e) => setLiquidationThreshold(e.target.value)}
                    min="1"
                    max="95"
                    required
                  />
                  <Form.Text className="text-muted">
                    Must be higher than Max LTV. Recommended: 75-90%.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Base Interest Rate (% APR)</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="5" 
                    value={baseInterestRate}
                    onChange={(e) => setBaseInterestRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Add Collection'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        {/* Oracle Management Tab */}
        <Tab eventKey="oracle" title="Oracle Management">
          <Card>
            <Card.Body>
              <Card.Title>Update Floor Price</Card.Title>
              <Form onSubmit={handleUpdateFloorPrice}>
                <Form.Group className="mb-3">
                  <Form.Label>Collection Address</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="0x..." 
                    value={oracleCollectionAddress}
                    onChange={(e) => setOracleCollectionAddress(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Floor Price (DPSV)</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="0.1" 
                    value={floorPrice}
                    onChange={(e) => setFloorPrice(e.target.value)}
                    min="0"
                    step="0.001"
                    required
                  />
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Update Floor Price'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        {/* Liquidation Management Tab */}
        <Tab eventKey="liquidation" title="Liquidation Management">
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Manual Liquidation</Card.Title>
              <Form onSubmit={handleLiquidateLoan}>
                <Form.Group className="mb-3">
                  <Form.Label>Collection Address</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="0x..." 
                    value={liquidationCollectionAddress}
                    onChange={(e) => setLiquidationCollectionAddress(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Token ID</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="1" 
                    value={liquidationTokenId}
                    onChange={(e) => setLiquidationTokenId(e.target.value)}
                    min="0"
                    required
                  />
                </Form.Group>
                
                <Button 
                  variant="danger" 
                  type="submit"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Liquidate Loan'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Body>
              <Card.Title>Loans at Risk</Card.Title>
              
              <Button 
                variant="outline-primary" 
                onClick={fetchRiskLoans} 
                disabled={isLoadingRiskLoans}
                className="mb-3"
              >
                {isLoadingRiskLoans ? 'Loading...' : 'Refresh List'}
              </Button>
              
              {isLoadingRiskLoans ? (
                <div className="text-center my-4">
                  <Spinner animation="border" />
                  <p>Loading at-risk loans...</p>
                </div>
              ) : riskLoans.length === 0 ? (
                <Alert variant="success">
                  No loans are currently at risk of liquidation.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Collection</th>
                      <th>Token ID</th>
                      <th>Current LTV</th>
                      <th>Liquidation Threshold</th>
                      <th>Total Debt</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskLoans.map((loan, index) => (
                      <tr key={index}>
                        <td>{loan.borrower.substring(0, 6)}...{loan.borrower.substring(38)}</td>
                        <td>{loan.collectionAddress.substring(0, 6)}...{loan.collectionAddress.substring(38)}</td>
                        <td>{loan.tokenId}</td>
                        <td>{loan.currentLTV.toFixed(2)}%</td>
                        <td>{loan.liquidationThreshold.toFixed(2)}%</td>
                        <td>{formatUnits(loan.totalDebt.toString(), 18)} DPSV</td>
                        <td>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => {
                              setLiquidationCollectionAddress(loan.collectionAddress);
                              setLiquidationTokenId(loan.tokenId);
                            }}
                          >
                            Liquidate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        {/* DPO Token Setup Tab */}
        <Tab eventKey="dpo" title="DPO Token">
          <Card className="mt-3">
            <Card.Body>
              <Card.Title>Set DPO Token Address</Card.Title>
              <Form onSubmit={async (e) => {
                e.preventDefault();
                if (!contractService) return;
                try {
                  setIsProcessing(true);
                  await contractService.setDPOToken(dpoAddress);
                  showSuccess('DPO token address set');
                  setDpoAddress('');
                } catch (err) {
                  showError(err.message || 'Failed');
                } finally {
                  setIsProcessing(false);
                }
              }}>
                <Form.Group className="mb-3">
                  <Form.Label>DPO Token Contract Address</Form.Label>
                  <Form.Control type="text" value={dpoAddress} onChange={(e) => setDpoAddress(e.target.value)} placeholder="0x..." required />
                </Form.Group>
                <Button type="submit" disabled={isProcessing}> {isProcessing ? 'Processing...' : 'Set'} </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminPage; 