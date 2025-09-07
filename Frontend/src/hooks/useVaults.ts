import { useState, useEffect } from 'react';
import { Vault, UserPosition } from '../types';
import { useApi } from './useApi';

export const useVaults = () => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getVaults, getUserPositions } = useApi();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vaultsData, positionsData] = await Promise.all([
          getVaults(),
          getUserPositions()
        ]);
        setVaults(vaultsData);
        setPositions(positionsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetch = async () => {
    try {
      const [vaultsData, positionsData] = await Promise.all([
        getVaults(),
        getUserPositions()
      ]);
      setVaults(vaultsData);
      setPositions(positionsData);
    } catch (err) {
      setError(err.message);
    }
  };

  return { vaults, positions, loading, error, refetch };
};
