import { useState } from 'react';
import { Container, Row, Col, Tab, Tabs, Card } from 'react-bootstrap';
import MyNFTs from '../components/MyNFTs';
import VaultAssets from '../components/VaultAssets';
import { useWeb3 } from '../hooks/useWeb3';

const DashboardPage = () => {
  const { account } = useWeb3();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Callback for when an NFT is deposited
  const handleNFTDeposited = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <Container fluid className="py-4 px-4">
      <h1 className="mb-4 text-center">Mosaical GameFi NFT Lending</h1>
      
      {!account ? (
        <Card className="text-center p-5 shadow-sm">
          <Card.Body>
            <Card.Title className="fs-2 mb-3">Welcome to Mosaical DeFi</Card.Title>
            <Card.Text className="fs-5">
              Connect your wallet to start using the GameFi NFT Lending Platform.
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Tabs defaultActiveKey="my-nfts" className="mb-4">
            <Tab eventKey="my-nfts" title="My NFTs">
              <MyNFTs onNFTDeposited={handleNFTDeposited} />
            </Tab>
            
            <Tab eventKey="my-vault" title="My Vault">
              <VaultAssets refreshTrigger={refreshTrigger} />
            </Tab>
          </Tabs>
        </>
      )}
    </Container>
  );
};

export default DashboardPage; 