import React from 'react';
import { AlertTriangle, Save, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info';
    confirmText?: string;
    cancelText?: string;
    showThirdButton?: boolean;
    thirdButtonText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    onThirdAction?: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showThirdButton = false,
    thirdButtonText = 'Third Action',
    onConfirm,
    onCancel,
    onThirdAction,
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
            case 'danger':
                return <AlertTriangle className="w-6 h-6 text-red-600" />;
            default:
                return <AlertTriangle className="w-6 h-6 text-blue-600" />;
        }
    };

    const getConfirmButtonClass = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-700 text-white';
            default:
                return 'bg-blue-600 hover:bg-blue-700 text-white';
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 10001 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
                {/* Icon and Title */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6">
                    {showThirdButton && onThirdAction && (
                        <button
                            onClick={onThirdAction}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            {thirdButtonText}
                        </button>
                    )}

                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${getConfirmButtonClass()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
