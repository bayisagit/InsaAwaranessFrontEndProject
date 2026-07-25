'use client';

import React, { useState, useRef } from 'react';

interface CloudinaryUploadProps {
    onUploadSuccess: (url: string) => void;
    label?: string;
    folder?: string;
    resourceType?: 'auto' | 'image' | 'video' | 'raw';
    className?: string;
    value?: string;
    disabled?: boolean;
    children?: React.ReactNode;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
    onUploadSuccess,
    label = 'Upload File',
    folder = 'lms-uploads',
    resourceType = 'auto',
    className = '',
    value = '',
    disabled = false,
    children
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!cloudName || !uploadPreset) {
            setError('Cloudinary configuration missing. Please check your .env.local file.');
            return;
        }

        setIsUploading(true);
        setProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', folder);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status === 200) {
                    onUploadSuccess(response.secure_url);
                    setIsUploading(false);
                } else {
                    setError(response.error?.message || 'Upload failed');
                    setIsUploading(false);
                }
            };

            xhr.onerror = () => {
                setError('Network error during upload');
                setIsUploading(false);
            };

            xhr.send(formData);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setIsUploading(false);
        }
    };

    const triggerUpload = () => {
        if (!isUploading && !disabled) fileInputRef.current?.click();
    };

    if (children) {
        return (
            <>
                <div onClick={triggerUpload} className={`inline-block ${className}`}>
                    {children}
                </div>
                {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-primary font-medium mt-1">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span>Uploading... {progress}%</span>
                    </div>
                )}
                {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading || disabled}
                    accept={resourceType === 'video' ? 'video/*' : resourceType === 'image' ? 'image/*' : '*'}
                />
            </>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="block text-sm font-semibold text-gray-700">{label}</label>}

            <div className="relative">
                <div
                    onClick={triggerUpload}
                    className={`
                        w-full px-4 py-3 border-2 border-dashed rounded-xl ${!disabled && !isUploading ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                        transition-all duration-200 flex items-center justify-between
                        ${isUploading ? 'bg-gray-50 border-gray-200' : disabled ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300 hover:border-primary hover:bg-primary/5'}
                        ${value && !isUploading && !disabled ? 'border-green-300 bg-green-50/30' : ''}
                    `}
                >
                    <div className="flex-1 min-w-0 mr-4">
                        {isUploading ? (
                            <div className="flex items-center gap-3">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                <span className="text-sm font-medium text-gray-600">Uploading... {progress}%</span>
                            </div>
                        ) : value ? (
                            <div className="flex items-center gap-2">
                                <span className="text-green-600">✓</span>
                                <span className="text-sm font-medium text-gray-700 truncate">{value}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500">Click to select or drag and drop</span>
                        )}
                    </div>

                    {!isUploading && !disabled && (
                        <button
                            type="button"
                            className="text-xs font-semibold text-primary uppercase tracking-wider"
                        >
                            {value ? 'Change' : 'Browse'}
                        </button>
                    )}
                </div>

                {isUploading && (
                    <div className="absolute bottom-0 left-0 h-1 bg-primary rounded-b-xl transition-all duration-300" style={{ width: `${progress}%` }}></div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || disabled}
                accept={resourceType === 'video' ? 'video/*' : resourceType === 'image' ? 'image/*' : '*'}
            />

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            {value && !isUploading && (
                <p className="text-[10px] text-gray-400 truncate">Current URL: {value}</p>
            )}
        </div>
    );
};
