import { useContext, createContext } from "react";
import { useLocalStorage } from "../hook/useLocalStorage";

const ControlPanelContext = createContext(null);

export function ControlPanelProvider({ children }) {
  const [countCellLocalStorage, setCountCellLocalStorage] = useLocalStorage("countCell", 20);
  const [sizeCellLocalStorage, setSizeCellLocalStorage] = useLocalStorage("sizeCell", 0.2);
  const [showGridLocalStorage, setShowGridLocalStorage] = useLocalStorage("showGrid", true);

  const [formSurfaceLocalStorage, setformSurfaceLocalStorage] = useLocalStorage("formSurface", 1);

  const [radiusCameraLocalStorage, setRadiusCameraLocalStorage] = useLocalStorage("radiusCamera", 15);
  const [azimuthCameraLocalStorage, setAzimuthCameraLocalStorage] = useLocalStorage("azimuthCamera", 0);

  const setCountCell = (value) => setCountCellLocalStorage(value);
  const setSizeCell = (value) => setSizeCellLocalStorage(value);
  const setShowGrid = (value) => setShowGridLocalStorage(value);

  const setformSurface = (value) => setformSurfaceLocalStorage(value)

  const setRadiusCamera = (value) => setRadiusCameraLocalStorage(value);
  const setAzimuthCamera = (value) => setAzimuthCameraLocalStorage(value);
  
  const resetValue = () => {
    setCountCellLocalStorage(20)
    setSizeCellLocalStorage(0.2)
    setShowGridLocalStorage(true)

    setformSurfaceLocalStorage(1)

    setRadiusCameraLocalStorage(15)
    setAzimuthCameraLocalStorage(0)
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
    },
    formSurface: {
      formSurface: formSurfaceLocalStorage,
      setformSurface
    },
    camera: {
      radiusCamera: radiusCameraLocalStorage,
      setRadiusCamera,
      azimuthCamera: azimuthCameraLocalStorage,
      setAzimuthCamera
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
