import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import circuits from '../files/Circuits';
import './Races.css';

const Races = () => {
  const [races, setRaces] = useState([]);

  useEffect(() => {
    axios.get('https://api.openf1.org/v1/meetings?year=2024')
      .then(response => {
        setRaces(response.data);
        console.log(response.data); 
      })
      .catch(error => {
        console.error('Error fetching races:', error);
      });
  }, []);

  const setImage = (str, arr) => {
    const result = arr.filter(elem => {
      return elem.name === str
    })[0];



    return result !== undefined ? result.img_url : 'https://mala.ae/wp-content/uploads/2023/02/Adventure5.png';
  }
  

  return (
    <div className='container bg-slate-500 px-4 min-h-screen'>
      <div className='w-3/4 m-auto'>
        <h1 className='text-red-500 text-center text-5xl font-bold h-40 flex justify-center items-center'>RACES F1 - 2023</h1>
        <ul className='grid sm:grid-cols-3 md:grid-cols-3 gap-10'>
          {races.map((race, idx) => (
              <li key={idx} className='p-4 text-center text-white bg-zinc-200 rounded-md cursor-pointer hover:scale-105 ease-out duration-300 hover:rotate-2 flag ' style={{ backgroundImage: `url(${setImage(race.country_name, circuits)}) `}}>
                <Link to={`/race/${race.meeting_id}`}>
                  <strong>{race.meeting_name}</strong> - {race.location} - {race.country_name}
                </Link>
              </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Races;
