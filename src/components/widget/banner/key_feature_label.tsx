interface LabelProperties {
  Icon: any;
  FeatureTitle: string;
  Technology: string;
  Description: string;
  className: string;

  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
}
export default function KeyFeatureLabel({
  Icon,
  FeatureTitle,
  Technology,
  Description,
  className,
  isDesktop,
  isTablet,
  isMobile,
  
}: LabelProperties) {
  return (
    <div
      className={`flex ${className} 
        ${isMobile ? "p-1 gap-1" : "p-2 gap-2"}`}
    >
      <span>{Icon}</span>
      <div className="flex flex-col items-start justify-start">
        <div className="flex gap-2 items-center">
          <p
            className={`font-semibold
              ${
                isDesktop
                  ? "text-lg"
                  : isTablet
                    ? "text-md"
                    : isMobile 
                    && "text-sm"     
              }`}
          >
            {FeatureTitle}
          </p>
          <p
            className={`
              ${
                isDesktop
                  ? "text-md"
                  : isTablet
                    ? "text-sm"
                    : isMobile 
                    && "text-xs"     
              }`}
          >
            ({Technology})
          </p>
        </div>
        <p
          className={`
           ${
                isDesktop
                  ? "text-md"
                  : isTablet
                    ? "text-sm"
                    : isMobile 
                    && "text-xs"     
              }`}
        >
          {Description}
        </p>
      </div>
    </div>
  );
}