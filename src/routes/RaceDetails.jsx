import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader'

const RaceDetails = () => {
  const { id } = useParams();
  const [raceDetails, setRaceDetails] = useState(null);

  useEffect(() => {
    axios.get(`https://api.openf1.org/v1/meetings/${id}`)
      .then(response => {
        setRaceDetails(response.data);
      })
      .catch(error => {
        console.error('Error fetching race details:', error);
      });
  }, [id]);
  

  if (!raceDetails) {
    return <Loader></Loader>
  }

  return (
    <div className='container bg-slate-100 p-4'>
      <h2 className='text-center text-3xl font-bold'>{raceDetails.meeting_name}</h2>
      <p><strong>Country:</strong> {raceDetails.country_name}</p>
      <p><strong>Location:</strong> {raceDetails.location}</p>
      <p><strong>Date:</strong> {raceDetails.date}</p>
    </div>
  );
};

export default RaceDetails;
