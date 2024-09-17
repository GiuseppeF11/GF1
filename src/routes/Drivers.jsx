import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);


  useEffect(() => {
    axios.get('https://api.openf1.org/v1/drivers')
      .then(response => {
        setDrivers(response.data);
        console.log(response)
      })
      .catch(error => {
        console.error('Error fetching drivers:', error);
      });
  }, []);


  return (
    <div>
      <ul>
        {drivers.map(driver => (
          <li><strong>{driver.meeting_name}</strong></li>
        ))}
      </ul>
    </div>
  );
};


export default Drivers;