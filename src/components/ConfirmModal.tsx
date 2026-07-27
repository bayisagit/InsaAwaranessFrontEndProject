import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: 'danger' | 'warning' | 'info';
}

const variantConfig = {
    danger: {
        icon: 'text-red-500 bg-red-50',
        confirmVariant: 'danger' as const,
        border: 'border-red-100',
    },
    warning: {
        icon: 'text-yellow-500 bg-yellow-50',
        confirmVariant: 'primary' as const,
        border: 'border-yellow-100',
    },
    info: {
        icon: 'text-blue-500 bg-blue-50',
        confirmVariant: 'primary' as const,
        border: 'border-blue-100',
    },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed? This action may be permanent.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    variant = 'danger'
}) => {
    const styles = variantConfig[variant];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
            <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${styles.icon}`}>
                    {variant === 'danger' && (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    {variant === 'warning' && (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {variant === 'info' && (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground mb-8 px-4">{message}</p>

                <div className="flex w-full gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1 cursor-pointer transition-colors duration-200" disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button variant={styles.confirmVariant} onClick={onConfirm} className="flex-1 cursor-pointer transition-colors duration-200" loading={isLoading}>
                        {isLoading ? 'Processing...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
