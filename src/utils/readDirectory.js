// src/utils/readDirectory.js

const readAllEntries = (reader) => {
  return new Promise((resolve, reject) => {
    let allEntries = [];
    const readEntries = () => {
      reader.readEntries((entries) => {
        if (entries.length) {
          allEntries = allEntries.concat(entries);
          readEntries();
        } else {
          resolve(allEntries);
        }
      }, reject);
    };
    readEntries();
  });
};

// Reads the immediate content of a directory (lazy loading)
export const readDirectoryNonRecursive = async (directoryEntry) => {
  const reader = directoryEntry.createReader();
  const entries = await readAllEntries(reader);
  const children = await Promise.all(
    entries.map(async (entry) => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          // Skip unreadable files so a single bad entry does not block the whole directory
          const skip = (err) => {
            console.warn(`Skipping unreadable file "${entry.name}":`, err);
            resolve(null);
          };
          entry.file((file) => {
            const validImageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "avif"];
            const validVideoExtensions = ["mp4", "webm", "ogg", "mov"];
            const ext = file.name.split(".").pop().toLowerCase();
            if (validImageExtensions.includes(ext)) {
              resolve({ name: file.name, type: "image", file });
            } else if (validVideoExtensions.includes(ext)) {
              resolve({ name: file.name, type: "video", file });
            } else {
              resolve(null);
            }
          }, skip);
        });
      } else if (entry.isDirectory) {
        return { name: entry.name, type: "directory", entry };
      } else {
        return null;
      }
    })
  );
  const filteredChildren = children.filter((item) => item !== null);
  // Natural, case-insensitive sort by name (img2 before img10)
  filteredChildren.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
  return {
    name: directoryEntry.name,
    type: "directory",
    children: filteredChildren,
    entry: directoryEntry,
  };
};
