import { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Spinner, Card, Button } from 'react-bootstrap';
import { useWeb3 } from '../hooks/useWeb3';
import { useContracts } from '../hooks/useContracts';
import { useNotification } from '../contexts/NotificationContext';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants/contracts';

// Import ABI
import MockGameNFT_ABI from '../abi/contracts/MockGameNFT.sol/MockGameNFT.json';

// Component to display a single NFT card
function NFTCard({ tokenId, onDeposit }) {
  return (
    <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
      <Card className="h-100 shadow-sm border">
        <Card.Img 
          variant="top"
          src={`https://via.placeholder.com/300/6c757d/ffffff?text=NFT+%23${tokenId}`}
          alt={`NFT #${tokenId}`}
          style={{ height: '180px', objectFit: 'cover', padding: '10px' }}
        />
        <Card.Body style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card.Title className="text-truncate" title={`Test Game NFT #${tokenId}`}>Test Game NFT #{tokenId}</Card.Title>
          <Card.Text style={{ whiteSpace: 'normal' }}>
            This is an NFT that can be used as collateral on Mosaical.
          </Card.Text>
          <div className="d-grid gap-2 mt-auto" style={{ width: '100%' }}>
            <Button 
              variant="primary" 
              onClick={() => onDeposit(tokenId)}
              className="w-100"
            >
              Deposit
            </Button>
          </div>
          <div className="mt-3" style={{ width: '100%' }}>
            <small className="text-muted d-block" style={{ whiteSpace: 'normal' }}>Token ID: {tokenId}</small>
            <small className="text-muted d-block" style={{ whiteSpace: 'normal' }} title={CONTRACT_ADDRESSES.MockGameNFT}>
              Contract: {CONTRACT_ADDRESSES.MockGameNFT.substring(0, 6)}...{CONTRACT_ADDRESSES.MockGameNFT.substring(CONTRACT_ADDRESSES.MockGameNFT.length - 4)}
            </small>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

const MyNFTs = ({ onNFTDeposited }) => {
  const { account, provider } = useWeb3();
  const { contractService } = useContracts();
  const { showError, showSuccess } = useNotification();
  
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- THIS IS THE MOST IMPORTANT LOGIC ---
  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!account || !provider) return;

      setIsLoading(true);
      setError('');
      setOwnedNFTs([]); 

      try {
        // 1. Create contract instance to interact with MockGameNFT
        const contract = new ethers.Contract(
          CONTRACT_ADDRESSES.MockGameNFT, 
          MockGameNFT_ABI.abi, 
          provider
        );
        const userNFTs = [];

        // 2. Get total NFTs owned by the user
        const balance = await contract.balanceOf(account);
        if (balance.toString() === "0") {
          setIsLoading(false);
          return;
        }

        // 3. Scan through token IDs to find user's NFTs
        // Simple approach for MVP, not optimized for large collections
        for (let i = 0; userNFTs.length < parseInt(balance.toString()); i++) {
          try {
            const owner = await contract.ownerOf(i);
            if (owner.toLowerCase() === account.toLowerCase()) {
              // Found one of the user's NFTs!
              userNFTs.push({ tokenId: i.toString() });
            }
          } catch (e) {
            // Skip "token doesn't exist" errors as we're scanning
            if (i > 100) break; // Set a scan limit to avoid infinite loop
          }
        }
        
        setOwnedNFTs(userNFTs);

      } catch (err) {
        console.error("Failed to fetch NFTs from contract:", err);
        setError('Could not fetch NFT data from the contract.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnedNFTs();
  }, [account, provider]); // Re-run this logic whenever the account changes

  // Handle depositing an NFT
  const handleDepositNFT = async (tokenId) => {
    if (!contractService) {
      showError('Contract service not available');
      return;
    }

    try {
      const collectionAddress = CONTRACT_ADDRESSES.MockGameNFT;
      
      await contractService.depositNFT(collectionAddress, tokenId);
      showSuccess('NFT successfully deposited!');
      
      // Notify parent component to refresh vault assets
      if (onNFTDeposited) {
        onNFTDeposited();
      }
    } catch (err) {
      console.error('Error depositing NFT:', err);
      showError(`Failed to deposit NFT: ${err.message || err}`);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Scanning your NFTs on-chain...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  // Show empty state
  if (!account) {
    return <Alert variant="info">Please connect your wallet to see your NFTs.</Alert>;
  }

  // Show empty collection state
  if (ownedNFTs.length === 0) {
    return <Alert variant="info">You do not own any NFTs from the supported collection.</Alert>;
  }

  // Show NFTs
  return (
    <Container fluid className="mt-4 px-4">
      <h3 className="mb-3">Your NFTs</h3>
      <p className="text-muted mb-4">These are the NFTs in your wallet that can be deposited as collateral.</p>
      <Row className="g-3">
        {ownedNFTs.map(nft => (
          <NFTCard 
            key={nft.tokenId} 
            tokenId={nft.tokenId} 
            onDeposit={handleDepositNFT}
          />
        ))}
      </Row>
    </Container>
  );
};

export default MyNFTs; 