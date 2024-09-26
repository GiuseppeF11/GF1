import React from 'react'
import './Loader.css'

export default function Loader() {
  return (
    <div className="h-screen flex justify-center items-center ">
        <div id='background' className='border-b-8 w-80 justify-center flex border-[#3F3F3D] wallpaper'>
            <div className='w-40 rounded-full spin'>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/F1_tire_Pirelli_PZero_Red.svg/1200px-F1_tire_Pirelli_PZero_Red.svg.png" alt="" />
            </div>
        </div>
    </div>
  )
}
