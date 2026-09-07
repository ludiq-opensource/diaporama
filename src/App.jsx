// src/App.jsx
import { useState } from 'react';
import DropZone from './components/DropZone';
import Diaporama from './components/Diaporama';
import slideshowConfig from './config/SlideshowConfig.json';

function App() {
  const [directory, setDirectory] = useState(null);

  const handleDirectoryLoaded = (dir) => {
    setDirectory(dir);
  };

  return (
    <div className="App">
      {directory ? (
        <>
          <Diaporama directory={directory} config={slideshowConfig} />
          {/* Global drop zone to allow replacing the directory during playback */}
          <DropZone global onDirectoryLoaded={handleDirectoryLoaded} />
        </>
      ) : (
        <DropZone onDirectoryLoaded={handleDirectoryLoaded} />
      )}
    </div>
  );
}

export default App;


