import { createContext, useContext } from 'react';

interface ViewerContextType {
  viewer: Autodesk.Viewing.GuiViewer3D | null;
  setViewer: (viewer: Autodesk.Viewing.GuiViewer3D | null) => void;
}

export const ViewerContext = createContext<ViewerContextType>({
  viewer: null,
  setViewer: () => {}
});

export const useViewer = () => useContext(ViewerContext);