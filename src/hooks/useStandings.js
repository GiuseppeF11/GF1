import { useState, useEffect } from 'react';
import { getDriverStandings, getConstructorStandings } from '../services/jolpica';

export const useDriverStandings = (year = new Date().getFullYear()) => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStandings([]);
    setLoading(true);
    getDriverStandings(year)
      .then(setStandings)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [year]);

  return { standings, loading, error };
};

export const useConstructorStandings = (year = new Date().getFullYear()) => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStandings([]);
    setLoading(true);
    getConstructorStandings(year)
      .then(setStandings)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [year]);

  return { standings, loading, error };
};
