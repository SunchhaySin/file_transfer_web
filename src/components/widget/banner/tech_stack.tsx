export default function TechStack({
  isDesktop,
  isTablet,
  isMobile,
}: {
  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 items-start mb-2 w-full ">
      <p
        className={`font-semibold bg-yellow-400 shadow-[0px_0px_4px_0.5px_yellow] m-1 px-2 py-1 rounded-xl
                ${isDesktop ? "text-2xl" : isTablet ? "text-xl" : isMobile && "text-lg"}`}
      >
        Tech Stack
      </p>
      <div className="w-full flex overflow-x-auto items-center justify-around gap-4 p-1 bg-slate-500 rounded-full"> 
        <div className="logo shrink-0">
          <img src="/assets/Nodejs.png" width={60} alt="Node.js" /> 
        </div>
        <div className="logo shrink-0">
          <img src="/assets/TailwindCSS.png" width={140} alt="TailwindCSS" /> 
        </div>
        <div className="logo shrink-0">
          <img src="/assets/Vercel.png" width={90} alt="Vercel" /> 
        </div>
        <div className="logo shrink-0">
          <img src="/assets/react.svg" width={30} alt="React" />
        </div>
        <div className="logo shrink-0">
          <img src="/assets/typescript.png" width={35} alt="TypeScript" />
        </div>
        <div className="logo shrink-0">
          <img src="/assets/Vitejs.png" width={30} alt="Vite" />
        </div>
        <div className="logo shrink-0">
          <img src="/assets/github.png" width={100} alt="GitHub" />
        </div>
      </div>
    </div>
  );
}
