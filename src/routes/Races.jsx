import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Races = () => {
  const [races, setRaces] = useState([]);


  useEffect(() => {
    axios.get('https://api.openf1.org/v1/meetings')
      .then(response => {
        setRaces(response.data);
        console.log(response)
      })
      .catch(error => {
        console.error('Error fetching races:', error);
      });
  }, []);


  return (
    <div className='-bg--grey'>
      <h1 className=' -text--red '>RACES F1 - 2023</h1>
      <ul>
        {races.map(race => (
          <li><strong>{race.meeting_name}</strong> - {race.country_name} - {race.location}</li>
        ))}
      </ul>
    </div>
  );
};


export default Races;