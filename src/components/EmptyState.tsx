import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
            {icon && (
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5 text-gray-400">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
            {action && (
                <Button variant="primary" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
};
