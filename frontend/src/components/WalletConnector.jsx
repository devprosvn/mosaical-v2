import { useWeb3 } from '../hooks/useWeb3';
import { Button, Spinner, Badge } from 'react-bootstrap';

const WalletConnector = () => {
  const { account, isConnecting, error, connectWallet, disconnectWallet, formatAddress } = useWeb3();

  return (
    <div className="d-flex align-items-center">
      {!account ? (
        <Button 
          variant="primary" 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="fw-bold px-4 rounded-pill"
        >
          {isConnecting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </Button>
      ) : (
        <div className="d-flex align-items-center bg-dark-subtle p-2 rounded">
          <Badge bg="success" className="me-2 py-2 px-3">
            <i className="bi bi-wallet2 me-1"></i>
            {formatAddress(account)}
          </Badge>
          <Button 
            variant="outline-light" 
            size="sm"
            onClick={disconnectWallet}
            className="ms-2"
          >
            Disconnect
          </Button>
        </div>
      )}
      
      {error && <div className="text-danger ms-2">{error}</div>}
    </div>
  );
};

export default WalletConnector; 