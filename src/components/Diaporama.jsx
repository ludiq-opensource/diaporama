 
// src/components/Diaporama.jsx
import { useState, useEffect, useRef } from "react";
import exifr from "exifr";
import { readDirectoryNonRecursive } from "../utils/readDirectory";

const ZOOM_MIN = 0.1; // zoom-out below 1: image stays centered (pan ignored)
const ZOOM_MAX = 10;
const CADENCE_STEP = 500;
const CADENCE_MIN = 500;
const CADENCE_MAX = 30000;

// Pan is bounded on the real rendered photo size (objectFit: contain) so no photo edge passes screen middle.
// offset is in screen pixels (the transform divides by scale before scaling back), so the bound scales with zoom.
const clampOffsetX = (value, scale, renderedWidth) => {
  const limit = renderedWidth ? (renderedWidth * scale) / 2 : window.innerWidth / 2;
  return Math.min(Math.max(value, -limit), limit);
};

const clampOffsetY = (value, scale, renderedHeight) => {
  const limit = renderedHeight ? (renderedHeight * scale) / 2 : window.innerHeight / 2;
  return Math.min(Math.max(value, -limit), limit);
};

// Real rendered size of an <img> with objectFit: contain (transform-independent)
const measureRendered = (img) => {
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;
  const fit = Math.min(img.clientWidth / img.naturalWidth, img.clientHeight / img.naturalHeight);
  return { width: img.naturalWidth * fit, height: img.naturalHeight * fit };
};

// Reverse order walks from the last child down to the first, so it must start at the end.
const startIndex = (children, order) => (order === "reverse" ? Math.max(children.length - 1, 0) : 0);

const DATE_FR_OPTIONS = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour12: false,
};

// Returns "N/A" for missing or corrupted EXIF dates instead of "Invalid Date"
const formatDateFr = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return isNaN(date) ? "N/A" : date.toLocaleString("fr-FR", DATE_FR_OPTIONS);
};

const overlayStyle = {
  position: "absolute",
  left: 10,
  background: "rgba(0,0,0,0.5)",
  color: "#fff",
  padding: "5px 10px",
  borderRadius: "5px",
  fontSize: "14px",
  zIndex: 20,
};

/**
 * Fullscreen slideshow for a dropped directory.
 * @param {{ directory: object, config: { autoplay?: boolean, order?: string, displayTime?: number, loop?: boolean } }} props
 */
const Diaporama = ({ directory, config }) => {
  const autoplay = config.autoplay === true;
  const order = config.order === "reverse" ? "reverse" : "normal";
  const initialDisplayTime =
    typeof config.displayTime === "number" ? Math.max(config.displayTime, CADENCE_MIN) : 3000;
  const loop = config.loop === true;

  // Hierarchical navigation state
  // currentDirectory: directory currently displayed
  // parentStack: array of { directory, index } used to go back up
  // currentIndex: index of the displayed item in currentDirectory.children
  const [currentDirectory, setCurrentDirectory] = useState(directory);
  const [parentStack, setParentStack] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(() => startIndex(directory.children, order));

  // Zoom and drag state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Autoplay state (play/pause)
  const [playing, setPlaying] = useState(autoplay);
  // Runtime autoplay cadence (ms), adjustable with a/z keys
  const [displayInterval, setDisplayInterval] = useState(initialDisplayTime);

  // Controls visibility state (cursor and button)
  const [controlsVisible, setControlsVisible] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const controlsTimerRef = useRef(null);
  const enteringRef = useRef(false);
  const rootRef = useRef(directory);
  const renderedSizeRef = useRef(null);
  const imgRef = useRef(null);

  // Object URL of the current media (created/revoked in useEffect for StrictMode)
  const [objectUrl, setObjectUrl] = useState(null);

  // Image metadata state
  const [metadata, setMetadata] = useState({
    fileModified: "N/A",
    contentCreated: "N/A",
  });

  // Reset state when a new directory is dropped
  useEffect(() => {
    rootRef.current = directory;
    setCurrentDirectory(directory);
    setParentStack([]);
    setCurrentIndex(startIndex(directory.children, order));
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setPlaying(autoplay);
    setDisplayInterval(initialDisplayTime);
  }, [directory, autoplay, initialDisplayTime, order]);

  // Reset zoom, offset and rendered size on item change (size is measured again on img load)
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    renderedSizeRef.current = null;
  }, [currentDirectory, currentIndex]);

  // Rendered size changes with the viewport
  useEffect(() => {
    const onResize = () => {
      renderedSizeRef.current = measureRendered(imgRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Keep the pan inside bounds when zooming out (bounds shrink with scale)
  useEffect(() => {
    setOffset((prev) => {
      const x = clampOffsetX(prev.x, scale, renderedSizeRef.current?.width);
      const y = clampOffsetY(prev.y, scale, renderedSizeRef.current?.height);
      return x === prev.x && y === prev.y ? prev : { x, y };
    });
  }, [scale]);

  // Autoplay: advance to the next image after displayTime ms
  useEffect(() => {
    let autoplayTimer;
    const currentItem = currentDirectory.children[currentIndex];
    if (playing && currentItem && currentItem.type === "image") {
      autoplayTimer = setTimeout(() => {
        goNext();
      }, displayInterval);
    }
    return () => {
      if (autoplayTimer) clearTimeout(autoplayTimer);
    };
  }, [playing, currentIndex, currentDirectory, displayInterval]);

  // Clear the controls-hide timer on unmount
  useEffect(() => () => clearTimeout(controlsTimerRef.current), []);

  // Hide controls after 2s of inactivity
  const handleGlobalMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  };

  // Intra-directory navigation (left/right arrows)
  const goNext = () => {
    setCurrentIndex((prev) => {
      const len = currentDirectory.children.length;
      if (len === 0) return prev;
      let nextIndex;
      if (order === "reverse") {
        nextIndex = prev === 0 ? (loop ? len - 1 : prev) : prev - 1;
      } else {
        nextIndex = prev === len - 1 ? (loop ? 0 : prev) : prev + 1;
      }
      return nextIndex;
    });
  };

  const goPrev = () => {
    setCurrentIndex((prev) => {
      const len = currentDirectory.children.length;
      if (len === 0) return prev;
      let nextIndex;
      if (order === "reverse") {
        nextIndex = prev === len - 1 ? (loop ? 0 : prev) : prev + 1;
      } else {
        nextIndex = prev === 0 ? (loop ? len - 1 : prev) : prev - 1;
      }
      return nextIndex;
    });
  };

  // Enter a directory ("Enter" key)
  const enterDirectory = async () => {
    if (enteringRef.current) return;
    const currentItem = currentDirectory.children[currentIndex];
    if (!currentItem || currentItem.type !== "directory") return;
    const fromDirectory = currentDirectory;
    const fromIndex = currentIndex;
    const rootAtStart = rootRef.current;
    enteringRef.current = true;
    try {
      const newDirectory = await readDirectoryNonRecursive(currentItem.entry);
      // A new root was dropped meanwhile: drop this navigation to keep state consistent
      if (rootRef.current !== rootAtStart) return;
      setParentStack((prev) => [
        ...prev,
        { directory: fromDirectory, index: fromIndex },
      ]);
      setCurrentDirectory(newDirectory);
      setCurrentIndex(startIndex(newDirectory.children, order));
    } catch (err) {
      console.error("Error reading directory:", err);
    } finally {
      enteringRef.current = false;
    }
  };

  // Go up one level ("PageUp" key)
  const goUp = () => {
    if (parentStack.length > 0) {
      const newStack = [...parentStack];
      const { directory: parentDirectory, index: parentIndex } = newStack.pop();
      setParentStack(newStack);
      setCurrentDirectory(parentDirectory);
      setCurrentIndex(parentIndex);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Leave browser/OS shortcuts (Cmd+A, Cmd+-, ...) untouched
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") {
        scale > 1 && setOffset((prev) => ({ ...prev, x: clampOffsetX(prev.x - 50 * scale, scale, renderedSizeRef.current?.width) }));
        scale <= 1 && goNext();
      } else if (e.key === "ArrowLeft") {
        scale > 1 && setOffset((prev) => ({ ...prev, x: clampOffsetX(prev.x + 50 * scale, scale, renderedSizeRef.current?.width) }));
        scale <= 1 && goPrev();
      } else if (e.key === "Enter") {
        await enterDirectory();
      } else if (e.key === "PageUp" || e.key === "Escape") {
        helpOpen ? setHelpOpen(false) : goUp();
      } else if (e.key === "h") {
        setHelpOpen((prev) => !prev);
      } else if (e.key === "a") {
        setDisplayInterval((prev) => Math.max(prev - CADENCE_STEP, CADENCE_MIN));
      } else if (e.key === "z") {
        setDisplayInterval((prev) => Math.min(prev + CADENCE_STEP, CADENCE_MAX));
      } else if (e.key === "ArrowUp") {
        scale > 1 && setOffset((prev) => ({ ...prev, y: clampOffsetY(prev.y + 50 * scale, scale, renderedSizeRef.current?.height) }));
      } else if (e.key === "ArrowDown") {
        scale > 1 && setOffset((prev) => ({ ...prev, y: clampOffsetY(prev.y - 50 * scale, scale, renderedSizeRef.current?.height) }));
      } else if (e.key === "+" || e.key === "=") {
        setScale((prev) => Math.min(prev * 1.1, ZOOM_MAX));
      } else if (e.key === "-") {
        setScale((prev) => Math.max(prev / 1.1, ZOOM_MIN));
      } else if (e.key === "1" || e.key === "0") {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      } else if (e.key === "2") {
        setScale(2);
      } else if (e.key === "3") {
        setScale(3);
      } else if (e.key === "4") {
        setScale(4);
      } else if (e.key === "5") {
        setScale(5);
      } else if (e.key === "6") {
        setScale(6);
      } else if (e.key === "7") {
        setScale(7);
      } else if (e.key === "8") {
        setScale(8);
      } else if (e.key === "9") {
        setScale(9);
      } else if (e.key === " ") {
        // A focused button or video handles Space natively: avoid a double toggle
        if (e.target.tagName === "BUTTON" || e.target.tagName === "VIDEO") return;
        e.preventDefault();
        setPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDirectory, currentIndex, parentStack, scale, helpOpen]);

  // Zoom via mouse wheel
  const handleWheel = (e) => {
    const delta = e.deltaY;
    setScale((prevScale) => {
      const newScale = prevScale - delta * 0.001;
      return Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);
    });
  };

  // Drag (pan) handling when zoomed in
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setOffset({
        x: clampOffsetX(e.clientX - dragStart.x, scale, renderedSizeRef.current?.width),
        y: clampOffsetY(e.clientY - dragStart.y, scale, renderedSizeRef.current?.height),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Current item
  const currentItem = currentDirectory.children[currentIndex];

  // Create/cleanup the media object URL
  useEffect(() => {
    if (currentItem && (currentItem.type === "image" || currentItem.type === "video")) {
      const url = URL.createObjectURL(currentItem.file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [currentItem]);

  // Extract image metadata (when the current item is an image or video)
  useEffect(() => {
    let cancelled = false;
    if (currentItem && (currentItem.type === "image" || currentItem.type === "video")) {
      const fileModified = currentItem.file.lastModified
        ? new Date(currentItem.file.lastModified).toLocaleString()
        : "N/A";

      if (currentItem.type === "image") {
        // Read EXIF metadata with exifr
        exifr
          .parse(currentItem.file)
          .then((result) => {
            const contentCreated = result
              ? formatDateFr(result.DateTimeOriginal || result.ModifyDate)
              : "N/A";
            if (cancelled) return;
            setMetadata({
              fileModified,
              contentCreated,
            });
          })
          .catch((err) => {
            if (cancelled) return;
            console.error("Error reading EXIF:", err);
            setMetadata({
              fileModified,
              contentCreated: "N/A",
            });
          });
      } else {
        // Videos only expose file dates for now
        setMetadata({
          fileModified,
          contentCreated: "N/A",
        });
      }
    } else {
      setMetadata({
        fileModified: "N/A",
        contentCreated: "N/A",
      });
    }
    return () => {
      cancelled = true;
    };
  }, [
    currentItem?.file?.name,
    currentItem?.file?.lastModified,
    currentItem?.file?.size,
    currentItem?.type,
  ]);

  let content;
  if (currentItem) {
    if (currentItem.type === "image") {
      content = (
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: "100%",
            height: "100%",
            cursor: controlsVisible ? (scale > 1 ? "grab" : "default") : "none",
          }}
        >
          <img
            ref={imgRef}
            src={objectUrl}
            alt={currentItem.name}
            onLoad={(e) => {
              renderedSizeRef.current = measureRendered(e.target);
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              transform: `scale(${scale}) translate(${scale > 1 ? offset.x / scale : 0}px, ${
                scale > 1 ? offset.y / scale : 0
              }px)`,
              transition: isDragging ? "none" : "transform 0.3s ease-out",
            }}
            draggable="false"
          />
        </div>
      );
    } else if (currentItem.type === "video") {
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <video
            key={currentItem.file.name} // Force re-mount on video change to trigger autoplay
            src={objectUrl}
            controls
            autoPlay
            playsInline
            onEnded={() => {
              if (playing) goNext();
            }}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      );
    } else if (currentItem.type === "directory") {
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff",
            fontSize: "24px",
          }}
        >
          <span>📁 {currentItem.name}</span>
        </div>
      );
    }
  } else {
    content = <div style={{ color: "#fff" }}>Aucun contenu</div>;
  }

  // Current path for the overlay (e.g. "root / Album1 / …")
  const path = parentStack
    .map((p) => p.directory.name)
    .concat(currentDirectory.name)
    .join(" / ");

  return (
    <div
      onMouseMove={handleGlobalMouseMove}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        cursor: controlsVisible ? (scale > 1 ? "grab" : "default") : "none",
        fontFamily: "Roboto, Arial, sans-serif",
      }}
    >
      {/* Path overlay */}
      <div
        style={{ ...overlayStyle, top: 10 }}
      >
        {path}
      </div>
      <div
        style={{ ...overlayStyle, top: 28, fontWeight: "bold", fontSize: "18px" }}
      >
        ({currentDirectory.children.length === 0 ? 0 : currentIndex + 1}/{currentDirectory.children.length})
      </div>

      {/* Permanent help hint: below the info overlays (metadata when a media is shown, counter otherwise) */}
      <div style={{ ...overlayStyle, top: currentItem && (currentItem.type === "image" || currentItem.type === "video") ? 160 : 80 }}>
        Aide : touche h
      </div>

      {/* Help lightbox: "h" toggles, click or Esc closes */}
      {helpOpen && (
        <div
          onClick={() => setHelpOpen(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.8)",
            zIndex: 40,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ ...overlayStyle, position: "static", fontSize: "16px", lineHeight: 1.8 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>Raccourcis</div>
            <div>← / → : précédent / suivant (déplace l’image si zoomée)</div>
            <div>↑ / ↓ : déplacement vertical (image zoomée)</div>
            <div>Molette ou + / - : zoom (0,1x à 10x)</div>
            <div>1–9 ou 0 : zoom direct (0/1 = réinitialiser)</div>
            <div>Souris : glisser pour déplacer l’image zoomée</div>
            <div>Entrée : ouvrir le dossier — PageUp ou Échap : dossier parent</div>
            <div>Espace : lecture / pause</div>
            <div>a / z : cadence autoplay ∓ 0,5 s (actuelle : {(displayInterval / 1000).toLocaleString("fr-FR")} s)</div>
            <div>h : ouvrir / fermer cette aide</div>
          </div>
        </div>
      )}

      {/* Image/video metadata overlay */}
      {currentItem && (currentItem.type === "image" || currentItem.type === "video") && (
        <div
          style={{ ...overlayStyle, top: 80 }}
        >
          <div>{currentItem.name}</div>
          <div>Fichier modifié le: {metadata.fileModified}</div>
          <div>Contenu créé le: {metadata.contentCreated}</div>
        </div>
      )}

      {/* Permanent play/pause player button (media items only), bottom-left, with current cadence while playing */}
      {currentItem && (currentItem.type === "image" || currentItem.type === "video") && (
        <div
          style={{
            position: "absolute",
            left: 10,
            bottom: 10,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => setPlaying((prev) => !prev)}
            title={playing ? "Pause" : "Lecture"}
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          {playing && (
            <div style={{ ...overlayStyle, position: "static" }}>
              {(displayInterval / 1000).toLocaleString("fr-FR")} s
            </div>
          )}
        </div>
      )}

      {content}
    </div>
  );
};

export default Diaporama;
