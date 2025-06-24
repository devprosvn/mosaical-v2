import { createContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Function to connect wallet
  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        setError(null);
        
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        const ethersProvider = new BrowserProvider(window.ethereum);
        const ethersSigner = await ethersProvider.getSigner();
        const network = await ethersProvider.getNetwork();
        
        setProvider(ethersProvider);
        setSigner(ethersSigner);
        setAccount(accounts[0]);
        setChainId(network.chainId);
        setIsConnected(true);
        setIsConnecting(false);
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        setError(error.message || 'Failed to connect wallet');
        setIsConnected(false);
        setIsConnecting(false);
      }
    } else {
      setError('Please install MetaMask or another Ethereum wallet');
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Function to disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== account) {
          // User switched accounts
          setAccount(accounts[0]);
          setIsConnected(true);
          connectWallet(); // Reconnect to get fresh signer
        }
      };

      const handleChainChanged = () => {
        // When network changes, reload the page as recommended by MetaMask
        window.location.reload();
      };

      // Subscribe to events
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account, connectWallet, disconnectWallet]);

  // Check if already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // User is already connected, initialize the connection
            connectWallet();
          }
        } catch (error) {
          console.error('Error checking existing connection:', error);
        }
      }
    };
    
    checkConnection();
  }, [connectWallet]);

  // Update isConnected whenever account changes
  useEffect(() => {
    setIsConnected(!!account);
  }, [account]);

  // Utility function to format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const contextValue = {
    provider,
    signer,
    account,
    chainId,
    isConnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
    formatAddress
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}; 