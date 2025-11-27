import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from '../AppSidebar/AppSidebar';

export interface DashboardContextType {
    selectedCollectionId: string | null;
    selectedTagId: string | null;
    setSelectedCollectionId: (id: string | null) => void;
    setSelectedTagId: (id: string | null) => void;
    isCollectionDialogOpen: boolean;
    setIsCollectionDialogOpen: (isOpen: boolean) => void;
    editingCollection: any;
    setEditingCollection: (collection: any) => void;
    isTagDialogOpen: boolean;
    setIsTagDialogOpen: (isOpen: boolean) => void;
    editingTag: any;
    setEditingTag: (tag: any) => void;
}

const MainLayout: React.FC = () => {
    const location = useLocation();
    const isEditor = location.pathname.startsWith('/editor');
    // Extract ID from path: /editor/123 -> 123
    const editorId = isEditor ? location.pathname.split('/')[2] : undefined;

    // AppSidebar 默认展开，只有用户手动点击才会折叠
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Dashboard State
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<any>(null);
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<any>(null);

    const handleSelectCollection = (id: string | null) => {
        setSelectedCollectionId(id);
        setSelectedTagId(null);
    };

    const handleSelectTag = (id: string | null) => {
        setSelectedTagId(id);
        setSelectedCollectionId(null);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AppSidebar
                mode={isEditor ? 'editor' : 'dashboard'}
                currentDrawingId={editorId}
                selectedCollectionId={selectedCollectionId}
                selectedTagId={selectedTagId}
                onSelectCollection={handleSelectCollection}
                onSelectTag={handleSelectTag}
                onEditCollection={(c) => { setEditingCollection(c); setIsCollectionDialogOpen(true); }}
                onEditTag={(t) => { setEditingTag(t); setIsTagDialogOpen(true); }}
                onCreateCollection={() => { setEditingCollection(null); setIsCollectionDialogOpen(true); }}
                onCreateTag={() => { setEditingTag(null); setIsTagDialogOpen(true); }}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <main
                className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-16' : 'ml-64'
                    }`}
            >
                <Outlet context={{
                    selectedCollectionId,
                    selectedTagId,
                    setSelectedCollectionId,
                    setSelectedTagId,
                    isCollectionDialogOpen,
                    setIsCollectionDialogOpen,
                    editingCollection,
                    setEditingCollection,
                    isTagDialogOpen,
                    setIsTagDialogOpen,
                    editingTag,
                    setEditingTag
                }} />
            </main>
        </div>
    );
};

export default MainLayout;
