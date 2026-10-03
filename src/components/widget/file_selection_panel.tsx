import { useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow';
import useScreenSize from '../provider/windowWidth';
import { useStateProvider } from '../provider/state_provider';
import IconCategorizer from '../../utils/misc/iconHelper';
import dragAndDropImage from '../../assets/drag-drop-svgrepo-com.svg';

export default function FileSelectionPanel() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {windowWidth, isMobile, isTablet, isDesktop} = useScreenSize();
    const { setIsSelectionPanel, selectedFiles, addSelectedFiles, removeSelectedFile, setIsTransferPanel, resetFilesList } = useStateProvider(
        useShallow((state) => ({
            setIsSelectionPanel: state.setIsSelectionPanel,
            selectedFiles: state.selectedFiles,
            addSelectedFiles: state.addSelectedFiles,
            removeSelectedFile: state.removeSelectedFile,
            setIsTransferPanel: state.setIsTransferPanel,
            resetFilesList: state.resetFilesList,
        }))
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            addSelectedFiles(Array.from(files ?? []));
            console.log("Added files:", selectedFiles);
        }
    };

    // Continue to transfer panel
    const handleOnContinue = () => {
      if(selectedFiles.length === 0 ) {
        alert("No selected files. Cannot Continue !!");
        return;
      }
      setIsSelectionPanel(false);
      setIsTransferPanel(true);
    }

    // Drag and drop handlers
    const [isDragging, setIsDragging] = useState(false);
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        addSelectedFiles(droppedFiles);
        console.log('Files dropped:', selectedFiles);
      }
    };

  return (
    <div
      className={`flex-1 flex flex-col justify-between items-center bg-white/80 rounded-3xl shadow-2xl gap-4 transition-all duration-300 ease-in-out min-h-0
         ${isDesktop ? "max-h-[calc(100lvh-19rem)]" : isTablet && windowWidth >= 1000 ? "max-h-[calc(100lvh-16rem)]" : isMobile && "max-h-[calc(100lvh-14rem)]"}
         ${
              isDesktop
                ? "px-10 py-6 w-250"
                : isTablet && windowWidth >= 1100
                  ? "px-8 py-4 w-200"
                  : windowWidth >= 1000
                    ? "px-6 py-3 w-175"
                    : windowWidth >= 800 
                      ? "px-4 py-2 w-150" 
                      : windowWidth >= 550 
                        ? "px-3 py-2 w-115"
                        : "px-3 py-2 w-80"
            }`}
    >
      <div
        className={`flex gap-2 items-center text-black/70 bg-blue-300 shadow-[0px_0px_4px_0.5px_blue] ${isDesktop ? "p-3 rounded-2xl" : isTablet ? "p-2 rounded-xl" : "p-1 rounded-lg"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={isDesktop ? "50px" : isTablet ? "40px" : "30px"}
          viewBox="0 -960 960 960"
          width={isDesktop ? "50px" : isTablet ? "40px" : "30px"}
          fill="currentColor"
        >
          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={isDesktop ? "50px" : isTablet ? "40px" : "30px"}
          viewBox="0 -960 960 960"
          width={isDesktop ? "50px" : isTablet ? "40px" : "30px"}
          fill="currentColor"
        >
          <path d="M360-240h160q17 0 28.5-11.5T560-280v-40l80 42v-164l-80 42v-40q0-17-11.5-28.5T520-480H360q-17 0-28.5 11.5T320-440v160q0 17 11.5 28.5T360-240ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={isDesktop ? "50px" : isTablet ? "40px" : "30px"}
          viewBox="0 -960 960 960"
          width={isDesktop ? "50px" : isTablet ? "40px" : "30px"}
          fill="currentColor"
        >
          <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
        </svg>
      </div>
      {windowWidth >= 800 && (
        <hr className="border border-black/20 w-full mt-1" />
      )}
      <div
        className={`flex gap-4 items-strech w-full flex-1 min-h-0
            ${windowWidth >= 1000 ? "flex-row" : "flex-col"}`}
      >
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl cursor-pointer transition-colors duration-300 ease-in-out
                    ${windowWidth >= 1280 ? "flex-1" : "w-full flex-1"}
                    ${isDragging
                      ? "border-blue-500 bg-blue-400/50 scale-[0.98] shadow-[inset_0_4px_12px_rgba(0,0,0,0.25)]"
                      : 'bg-gray-300/60 border border-gray-400/40 hover:bg-blue-300/40'
                    }`}
        >
          {isDragging ? (
            <img 
              src={dragAndDropImage}
              alt="Drag and Drop"
              className="w-10 h-10"
            />
          ): (
            <>
              <span className="inline group-hover:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="black"><path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>
                
              </span>
              <span className="hidden group-hover:inline">
                <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="black"><path d="M419-80q-28 0-52.5-12T325-126L107-403l19-20q20-21 48-25t52 11l74 45v-328q0-17 11.5-28.5T340-760q17 0 29 11.5t12 28.5v472l-97-60 104 133q6 7 14 11t17 4h221q33 0 56.5-23.5T720-240v-160q0-17-11.5-28.5T680-440H461v-80h219q50 0 85 35t35 85v160q0 66-47 113T640-80H419ZM167-620q-13-22-20-47.5t-7-52.5q0-83 58.5-141.5T340-920q83 0 141.5 58.5T540-720q0 27-7 52.5T513-620l-69-40q8-14 12-28.5t4-31.5q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 17 4 31.5t12 28.5l-69 40Zm335 280Z"/></svg>
              </span>
            </>
          )}
          <p className={`text-gray-700 text-center font-semibold ${isDesktop ? "text-md" : isTablet ? "text-sm" : "text-xs"}`}>
            {isDragging ? (
              "Drop files here"
            ) : (
              <>
                <span className="inline group-hover:hidden">
                  Drag & Drop files here or click to select files
                </span>
                <span className="hidden group-hover:inline font-semibold">
                  Click to select files
                </span>
              </>
            )}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className={"hidden"}
            onChange={handleFileChange}
            multiple
          />
        </div>
        {selectedFiles.length > 0 ? (
          <div
            className={`bg-gray-300 flex flex-col rounded-2xl min-h-0 overflow-hidden
                ${windowWidth >= 1280 ? "flex-1" : "w-full flex-2"}`}
          >
            <p className="font-bold text-lg text-center bg-blue-300 p-2 rounded-lg">
              Selected Files
            </p>
            <ul className={`w-full bg-gray-300 flex-1 flex flex-col gap-1 p-2 rounded-2xl overflow-y-auto min-h-0 
                ${isTablet && windowWidth < 1000 && "max-h-65"}
              `}>
              {selectedFiles.map((file, index) => (
                <li
                  key={index}
                  className="text-gray-700 w-full bg-white/60 rounded-lg px-3 py-1 flex items-center min-w-0"
                >
                  <div className="flex-1 flex gap-5 items-center min-w-0">
                    <span className="shrink-0">
                      {IconCategorizer(file.name)}
                    </span>
                    <div className="flex flex-col items-start min-w-0">
                      <p className="font-semibold truncate w-full">
                        {file.name}
                      </p>
                      <p className="text-sm">{`${(file.size / (1024 * 1024)).toFixed(2)} MB`}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeSelectedFile(file)}
                    className="text-red-500/80 hover:text-red-600 cursor-pointer transition-colors duration-200 ease-in-out"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="28px"
                      viewBox="0 -960 960 960"
                      width="28px"
                      fill="currentColor"
                    >
                      <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div
            className={`bg-gray-400/30 border border-gray-400/40 flex items-center justify-center p-2 rounded-2xl
                ${windowWidth >= 1280 ? "flex-1" : "w-full flex-1"}
                ${isDesktop ? "text-md" : isTablet ? "text-sm" : "text-xs"}`}
          >
            <p className="text-gray-700">No Files Selected !!</p>
          </div>
        )}
      </div>
      <p className="text-gray-500 text-sm">Maximum File Size: 1GB</p>
      <div className="flex items-center gap-4 w-full">
        <button
          className="flex-1 py-2 bg-blue-400 rounded-xl hover:bg-blue-500 transition-colors duration-200 ease-in-out cursor-pointer"
          onClick={handleOnContinue}
        >
          Continue
        </button>
        <button
          className="flex-1 py-2 bg-gray-400/80 rounded-xl hover:bg-gray-400 transition-colors duration-200 ease-in-out cursor-pointer"
          onClick={() => {
            setIsSelectionPanel(false);
            resetFilesList();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
