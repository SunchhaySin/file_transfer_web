import { create } from "zustand";
import { peerDiscovery } from "../../utils/handlers/peer_discovery";
import type { Peer } from '../../utils/config/client'
import { transfer } from "../../utils/handlers/transfer";
import type { TransferState as TransferSnapshot} from "../../utils/handlers/transfer";


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
}

type AppState = NavigationPanelState & SelectedFilesState & TransferState & DiscoveryStoreState;

let queue: { peerId: string; files: File[] } | null = null;
let advancing = false;

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

  selectedPeer: null,
  setSelectedPeer: (peer) => set({ selectedPeer: peer }),
  transferState: transfer.getSnapshot(),

  sendSelectedFiles: () => {
    const { selectedFiles, selectedPeer } = get();
    if (!selectedPeer || selectedFiles.length === 0) return;
    const [first, ...rest] = selectedFiles;
    queue = rest.length > 0 ? { peerId: selectedPeer.id, files: rest } : null;
    void transfer.send(selectedPeer.id, first);
  },
  acceptTransfer: () => transfer.accept(),
  declineTransfer: () => transfer.decline(),
  clearTransfer: () => {
    queue = null;
    transfer.reset();
  },
  cancelRequest: () => {
    queue = null;
    transfer.cancelRequest();
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
  const snap = transfer.getSnapshot();
  useStateProvider.setState({ transferState: snap });
 
  if (!queue || snap.direction !== "send") return;
 
  if (snap.status === "failed" || snap.status === "rejected") {
    queue = null; // stop sending the rest if one fails or is declined
  } else if (snap.status === "complete" && !advancing) {
    const next = queue.files.shift();
    const peerId = queue.peerId;
    if (queue.files.length === 0) queue = null;
    if (next) {
      advancing = true;
      setTimeout(() => {
        advancing = false;
        void transfer.send(peerId, next);
      }, 0); // defer so we don't start a transfer inside transfer's own notify loop
    }
  }
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