const LIBRARY_STORAGE_KEY = "excalidraw-library";

export const localStorageLibraryAdapter: any = {
    load: async () => {
        try {
            const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error("Failed to load library from localStorage", error);
        }
        return null;
    },
    save: async (libraryData: any) => {
        try {
            localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(libraryData));
        } catch (error) {
            console.error("Failed to save library to localStorage", error);
        }
    },
};
