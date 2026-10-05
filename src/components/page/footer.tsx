import React from 'react'
import useScreenSize from '../provider/windowWidth'

export default function Footer() {
   const { isMobile, isTablet, isDesktop } = useScreenSize();
  return (
    <div className={`h-40 bg-linear-to-b from-slate-900 to-slate-800/20 text-blue-500 grid grid-cols-2
        ${isDesktop ? "px-25 py-4 text-md" : isTablet ? "px-18 py-3 text-sm" : isMobile && "px-8 py-2 text-xs"}
      `}>
        <div className="flex flex-wrap justify-start">
          <p>
            Local Network Peer-to-Peer <strong>FILE-TRANSFER</strong> system.
          </p>

        </div>
        <div className="flex flex-wrap justify-end">
          <p>Git Hub: <a href='https://github.com/SunchhaySin' target='black'>https://github.com/SunchhaySin</a></p>
        </div>
    </div>
  )
}
