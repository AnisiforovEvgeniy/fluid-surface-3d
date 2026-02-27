import { useContext, createContext, useMemo } from "react";
import { useLocalStorage } from "../hook/useLocalStorage";

const ControlPanelContext = createContext(null);

export function ControlPanelProvider({ children }) {
  const [countCellLocalStorage, setCountCellLocalStorage] = useLocalStorage("countCell", 7);
  const [sizeCellLocalStorage, setSizeCellLocalStorage] = useLocalStorage("sizeCell", 0.2);
  const [showGridLocalStorage, setShowGridLocalStorage] = useLocalStorage("showGrid", true);

  const setCountCell = (value) => setCountCellLocalStorage(value);
  const setSizeCell = (value) => setSizeCellLocalStorage(value);
  const setShowGrid = (value) => setShowGridLocalStorage(value);
  const resetValue = () => {
    setCountCellLocalStorage(7)
    setSizeCellLocalStorage(0.2)
    setShowGridLocalStorage(true)
  }

  const value = {
    settings: {
      countCell: countCellLocalStorage,
      setCountCell,
      sizeCell: sizeCellLocalStorage,
      setSizeCell,
      showGrid: showGridLocalStorage,
      setShowGrid,
      resetValue
    }
  }

  return (
    <>
      <ControlPanelContext.Provider value={value}>
        {children}
      </ControlPanelContext.Provider>
    </>
  );
}

export function useControlPanel() {
  const context = useContext(ControlPanelContext);
  if (!context) {
    throw new Error(
      "useControlPanel должен использоваться внутри ControlPanelProvider",
    );
  }
  return context;
}
