import React, { useState } from 'react';
import Card from '../components/Card';
import { UploadIcon } from '../components/icons/UploadIcon';

interface UploadViewProps {
    onFileUpload: (file: File) => void;
    isLoading: boolean;
    statusMessage: string;
    error: string | null;
}

const SupportedFormat: React.FC<{ format: string; description: string }> = ({ format, description }) => (
    <div className="flex items-center space-x-4">
        <div className="px-3 py-1 bg-secondary rounded-md">
            <p className="text-sm font-mono font-semibold text-secondary-foreground">{format}</p>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);


const UploadView: React.FC<UploadViewProps> = ({ 
    onFileUpload, isLoading, statusMessage, error
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Necessary to allow drop
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          onFileUpload(file);
        }
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-center">Document Upload</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center">Upload your learning materials to build the graph.</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.md"
                    disabled={isLoading}
                />
                <div
                    onClick={handleUploadClick}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`flex flex-col h-full items-center justify-center p-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        isDragging ? 'border-primary bg-secondary' : 'border-border hover:border-primary/50'
                    }`}
                >
                    <div className="w-12 h-12 flex items-center justify-center bg-secondary rounded-full mb-4">
                        <UploadIcon className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <p className="font-semibold text-foreground text-center">
                        <span className="text-primary">Drop files here</span> or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 text-center">Currently supports .txt and .md files</p>
                </div>
            </Card>
             <Card className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-4">Supported Formats</h3>
                <div className="grid grid-cols-1 gap-y-4">
                    <SupportedFormat format="TXT" description="Plain Text Files" />
                    <SupportedFormat format="MD" description="Markdown Documents" />
                    <SupportedFormat format="PDF" description="Portable Document Format (coming soon)" />
                    <SupportedFormat format="DOCX" description="Word Documents (coming soon)" />
                </div>
            </Card>

            {isLoading && <p className="text-center mt-4 text-muted-foreground">{statusMessage}</p>}
            {error && <p className="text-center mt-4 text-destructive">{error}</p>}
        </div>
    );
};

export default UploadView;