import { create } from "zustand";
import { peerDiscovery } from "../../utils/handlers/peer_discovery";
import type { Peer } from '../../utils/config/client'

interface NavigationPanelState {
  isSelectionPanel: boolean;
  isTransferPanel: boolean;
  setIsSelectionPanel: (open: boolean) => void;
  setIsTransferPanel: (open: boolean) => void;
};

interface SelectedFilesState {
  selectedFiles: File[];
  resetFilesList: () => void,
  addSelectedFiles: (files: File[]) => void;
  removeSelectedFile: (file: File) => void;
}

interface DiscoveryStoreState {
  connected: boolean;
  myId: string | null;
  myDeviceName: string;
  setMyDeviceName: (name: string) => void;
  peers: Peer[];
}

interface TransferState {

}

type AppState = NavigationPanelState & SelectedFilesState & TransferState & DiscoveryStoreState;

export const useStateProvider = create<AppState>((set) => ({
  // Navigation Panel State
  isSelectionPanel: false,
  isTransferPanel: false,
  setIsSelectionPanel: (open) => set({ isSelectionPanel: open }),
  setIsTransferPanel: (open) => set({ isTransferPanel: open }),

  // Selected Files State
  selectedFiles: [],
  addSelectedFiles: (files) => set((state) => ({ selectedFiles: [...state.selectedFiles, ...files] })),
  removeSelectedFile: (file) => set((state) => ({
    selectedFiles: state.selectedFiles.filter((f) => f.name !== file.name),
  })),
  resetFilesList: () => set(() => ({selectedFiles: []})),

  connected: false,
  myId: null,
  myDeviceName: localStorage.getItem('deviceName') ?? '',
  setMyDeviceName: (name) => {
    const trimmed = name.trim();
    localStorage.setItem('deviceName', trimmed);
    set({ myDeviceName: trimmed });
  },
  peers: [],
}));

const syncDiscovery = () => {
  const { connected, myId, peers } = peerDiscovery.getSnapshot();
  useStateProvider.setState({ connected, myId, peers });
};

const unsubscribe = peerDiscovery.subscribe(syncDiscovery);
syncDiscovery();

// Avoid duplicate subscriptions on Vite hot reload
if (import.meta.hot) import.meta.hot.dispose(unsubscribe);