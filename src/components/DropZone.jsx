// src/components/DropZone.jsx
import { useState, useEffect } from 'react';
import { readDirectoryNonRecursive } from '../utils/readDirectory';

/**
 * Directory drop zone. Renders the initial drop target, or a global overlay when `global` is true.
 * @param {{ onDirectoryLoaded: (directory: object) => void, global?: boolean }} props
 */
const DropZone = ({ onDirectoryLoaded, global = false }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  // relatedTarget is null only when the drag really leaves the zone (not when hovering children)
  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.relatedTarget === null) setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);

    const items = e.dataTransfer.items;
    if (items) {
      // Only keep the first dropped directory entry
      for (let i = 0; i < items.length; i++) {
        try {
          const entry = items[i].webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            const rootDirectory = await readDirectoryNonRecursive(entry);
            onDirectoryLoaded(rootDirectory);
            break;
          }
        } catch (err) {
          console.error('Error loading dropped directory:', err);
        }
      }
    }
  };

  // Global mode: allow dropping a new directory at any time
  useEffect(() => {
    if (global) {
      const handleGlobalDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
      };
      const handleGlobalDragLeave = (e) => {
        e.preventDefault();
        if (e.relatedTarget === null) setDragActive(false);
      };
      const handleGlobalDrop = async (e) => {
        await handleDrop(e);
      };
      window.addEventListener('dragover', handleGlobalDragOver);
      window.addEventListener('dragleave', handleGlobalDragLeave);
      window.addEventListener('drop', handleGlobalDrop);
      return () => {
        window.removeEventListener('dragover', handleGlobalDragOver);
        window.removeEventListener('dragleave', handleGlobalDragLeave);
        window.removeEventListener('drop', handleGlobalDrop);
      };
    }
  }, [global, onDirectoryLoaded]);

  if (global) {
    return (
      dragActive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            border: '4px dashed rgba(255, 255, 255, 0.8)',
            zIndex: 1000,
            boxSizing: 'border-box',
          }}
        />
      )
    );
  } else {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          width: '100vw',
          height: '100vh',
          background: '#000',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Roboto, Arial, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: 'calc(100% - 80px)',
            height: 'calc(100% - 80px)',
            border: dragActive ? '2px dashed #fff' : '2px dashed rgba(255, 255, 255, 0.35)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontSize: '18px',
          }}
        >
          Déposez un répertoire ici
        </div>
      </div>
    );
  }
};

export default DropZone;
