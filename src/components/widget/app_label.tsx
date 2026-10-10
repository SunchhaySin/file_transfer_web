import useScreenSize  from '../../provider/windowWidth';


export default function AppLabel() {
  const {windowWidth, isMobile, isTablet, isDesktop} = useScreenSize();
  return (
    <div className={`flex ${isDesktop ? "gap-2" : "gap-1"} items-center`}>
      <div className={`flex gap-2 items-center bg-yellow-400 shadow-[0px_0px_4px_0.5px_yellow] ${isDesktop || isTablet ? "p-1.5" : "p-1"} rounded-full`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={isDesktop ? "24px" : isTablet ? "20px" : "16px"}
          viewBox="0 -960 960 960"
          width={isDesktop ? "24px" : isTablet ? "20px" : "16px"}
          fill="currentColor"
        >
          <path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q97-30 162-118.5T718-480H480v-315l-240 90v207q0 7 2 18h238v316Z" />
        </svg>
        <p className={isDesktop ? "text-md" : isTablet ? "text-sm" : "text-xs"}>Secure</p>
      </div>
      <div className={`flex gap-2 items-center bg-blue-400 shadow-[0px_0px_4px_0.5px_blue] ${isDesktop || isTablet ? "p-1.5" : "p-1"} rounded-full`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={isDesktop ? "24px" : isTablet ? "20px" : "16px"}
          viewBox="0 -960 960 960"
          width={isDesktop ? "24px" : isTablet ? "20px" : "16px"}
          fill="currentColor"
        >
          <path d="M480-540ZM80-160v-80h400v80H80Zm120-120q-33 0-56.5-23.5T120-360v-360q0-33 23.5-56.5T200-800h560q33 0 56.5 23.5T840-720H200v360h280v80H200Zm600 40v-320H640v320h160Zm-180 80q-25 0-42.5-17.5T560-220v-360q0-25 17.5-42.5T620-640h200q25 0 42.5 17.5T880-580v360q0 25-17.5 42.5T820-160H620Zm100-300q13 0 21.5-9t8.5-21q0-13-8.5-21.5T720-520q-12 0-21 8.5t-9 21.5q0 12 9 21t21 9Zm0 60Z" />
        </svg>
        <p className={isDesktop ? "text-md" : isTablet ? "text-sm" : "text-xs"}>Direct</p>
      </div>
      <div className={`flex gap-2 items-center bg-red-400 shadow-[0px_0px_4px_0.5px_red] ${isDesktop || isTablet ? "p-1.5" : "p-1"} rounded-full`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={isDesktop ? "24px" : isTablet ? "20px" : "16px"}
          viewBox="0 -960 960 960"
          width={isDesktop ? "24px" : isTablet ? "20px" : "16px"}
          fill="currentColor"
        >
          <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z" />
        </svg>
        <p className={isDesktop ? "text-md" : isTablet ? "text-sm" : "text-xs"}>Favourite</p>
      </div>
    </div>
  );
}
