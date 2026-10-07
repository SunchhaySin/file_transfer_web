import { create } from "zustand";
import { peerDiscovery } from "../../utils/handlers/peer_discovery";
import type { Peer } from '../../utils/config/client'
import { transfer } from "../../utils/handlers/transferManager";
import type { TransferState as TransferSnapshot} from "../../utils/handlers/transferManager";


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
  selectedPeer: Peer | null;
  setSelectedPeer: (peer: Peer | null) => void;
  transferState: TransferSnapshot; // mirrored from transfer.ts (read-only for components)
  sendSelectedFiles: () => void;
  acceptTransfer: () => void;
  declineTransfer: () => void;
  clearTransfer: () => void;
  cancelRequest: () => void;

  generateQROffer: (files: File[]) => Promise<string>,
}

type AppState = NavigationPanelState & SelectedFilesState & TransferState & DiscoveryStoreState;

export const useStateProvider = create<AppState>((set, get) => ({
  // Navigation Panel State
  isSelectionPanel: false,
  isTransferPanel: false,
  setIsSelectionPanel: (open) => set({ isSelectionPanel: open }),
  setIsTransferPanel: (open) => set({ isTransferPanel: open }),

  // Selected Files State
  selectedFiles: [],
  addSelectedFiles: (files) => set((state) => ({ selectedFiles: [...state.selectedFiles, ...files] })),
  removeSelectedFile: (file) => set((state) => ({
    selectedFiles: state.selectedFiles.filter((f) => f !== file),
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

  selectedPeer: null,
  setSelectedPeer: (peer) => set({ selectedPeer: peer }),
  transferState: transfer.getSnapshot(),

  sendSelectedFiles: () => {
    const { selectedFiles, selectedPeer } = get();
    if (!selectedPeer || selectedFiles.length === 0) return;
    void transfer.send(selectedPeer.id, selectedFiles);
  },
  acceptTransfer: () => transfer.accept(),
  declineTransfer: () => transfer.decline(),
  clearTransfer: () => transfer.reset(),
  cancelRequest: () => transfer.cancelRequest(),
  
  generateQROffer: async (files: File[]) => {
    return await transfer.generateQROffer(files);
  },
}));

// Connect to the peer Discovery service
const syncDiscovery = () => {
  const { connected, myId, peers } = peerDiscovery.getSnapshot();
  const current = useStateProvider.getState().selectedPeer;
  const selectedPeer = current ? (peers.find((p) => p.id === current.id) ?? null) : null;
  useStateProvider.setState({ connected, myId, peers, selectedPeer });
};

// Connect to the file handler service (send && receive)
const syncTransfer = () => {
  useStateProvider.setState({ transferState: transfer.getSnapshot() });
};

const unsubDiscovery = peerDiscovery.subscribe(syncDiscovery);
const unsubTransfer = transfer.subscribe(syncTransfer);

syncDiscovery();
syncTransfer();

// Avoid duplicate subscriptions on Vite hot reload
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubDiscovery();
    unsubTransfer();
  });
}