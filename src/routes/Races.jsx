import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Races = () => {
  const [races, setRaces] = useState([]);

  useEffect(() => {
    axios.get('https://api.openf1.org/v1/meetings')
      .then(response => {
        setRaces(response.data);
        console.log(response.data); 
      })
      .catch(error => {
        console.error('Error fetching races:', error);
      });
  }, []);
  

  return (
    <div className='container bg-slate-500 px-4'>
      <h1 className='text-red-500 text-center text-5xl font-bold h-40 flex justify-center items-center'>RACES F1 - 2023</h1>
      <ul className='grid sm:grid-cols-3 md:grid-cols-4 gap-4'>
        {races.map(race => (
            <li key={race.meeting_id} className='p-4 text-center bg-zinc-200 rounded-md cursor-pointer hover:scale-105 ease-out duration-300 hover:rotate-2'>
              <Link to={`/race/${race.meeting_id}`}>
                <strong>{race.meeting_name}</strong> - {race.country_name} - {race.location}
              </Link>
            </li>
        ))}

      </ul>
    </div>
  );
};

export default Races;
