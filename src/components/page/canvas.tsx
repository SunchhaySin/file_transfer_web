import Dashboard from "./dashboard";
import Header from "./header";
import { useStateProvider } from "../../provider/state_provider";
import { useShallow } from "zustand/shallow";

export default function Canvas() {
  const { isCheckStatus, setIsCheckStatus, connected, isBannerOpened, setBanner} = useStateProvider(
    useShallow((state) => ({
      isCheckStatus: state.isCheckStatus,
      setIsCheckStatus: state.setIsCheckStatus,
      connected: state.connected,
      isBannerOpened: state.isBannerOpened,
      setBanner: state.setBannerOpened
    })),
  );

  return (
    <div className="relative flex-1 flex flex-col items-center w-full ">
      <Header
        connected={connected}
        isCheckStatus={isCheckStatus}
        setIsCheckStatus={setIsCheckStatus}
        isBannerOpened={isBannerOpened}
        setBanner={setBanner}
      />
      <Dashboard />
    </div>
  );
}
