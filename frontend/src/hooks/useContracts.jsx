import { useEffect, useState } from 'react';
import { useWeb3 } from './useWeb3';
import { ContractService } from '../services/contractService';

export const useContracts = () => {
  const { provider, signer } = useWeb3();
  const [contractService, setContractService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeContractService = async () => {
      try {
        setIsLoading(true);
        if (!provider) {
          setContractService(null);
        } else {
          const service = new ContractService(provider, signer);
          if (mounted) {
            setContractService(service);
          }
        }
      } catch (error) {
        console.error('Error initializing contract service:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeContractService();

    return () => {
      mounted = false;
    };
  }, [provider, signer]);

  return { contractService, isLoading };
}; 