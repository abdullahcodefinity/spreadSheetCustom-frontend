import React, { useState, useEffect } from 'react';
import { X, Upload, File } from 'lucide-react';

const FILE_TYPES = {
  pdf: {
    label: "PDF Document",
    accept: ".pdf",
    mimeTypes: ["application/pdf"]
  },
  excel: {
    label: "Excel Spreadsheet", 
    accept: ".xls,.xlsx",
    mimeTypes: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
  },
  image: {
    label: "Image",
    accept: ".jpg,.jpeg,.png",
    mimeTypes: ["image/jpeg", "image/png"] 
  },
  word: {
    label: "Word Document",
    accept: ".doc,.docx",
    mimeTypes: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
  }
};

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, type: string) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  console.log("ImageModal - isOpen:", isOpen);

  useEffect(() => {
    if (!isOpen) {
      setSelectedType('');
      setFile(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) {
    console.log("ImageModal - returning null because isOpen is false");
    return null;
  }

  const validateFile = (file: File, type: string) => {
    const fileType = FILE_TYPES[type as keyof typeof FILE_TYPES];
    if (!fileType) return false;

    return fileType.mimeTypes.includes(file.type);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!selectedType) {
      setError('Please select a file type first');
      return;
    }

    const droppedFile = e.dataTransfer.files[0];
    if (validateFile(droppedFile, selectedType)) {
      setFile(droppedFile);
      setError('');
    } else {
      setError(`Invalid file type. Please upload a ${FILE_TYPES[selectedType as keyof typeof FILE_TYPES].label} file`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedType) {
      setError('Please select a file type first');
      return;
    }

    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile, selectedType)) {
      setFile(selectedFile);
      setError('');
    } else {
      setError(`Invalid file type. Please upload a ${FILE_TYPES[selectedType as keyof typeof FILE_TYPES].label} file`);
    }
  };

  const handleUpload = () => {
    if (file && selectedType) {
      onUpload(file, selectedType);
      onClose();
    }
  };

  console.log("ImageModal - rendering modal");
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 image-modal">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden image-modal">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
              <File className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
              <p className="text-sm text-gray-600">Select type and upload file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a file type</option>
              {Object.entries(FILE_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop your file here, or
              <label className="mx-2 text-blue-600 hover:text-blue-500 cursor-pointer">
                browse
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept={selectedType ? FILE_TYPES[selectedType as keyof typeof FILE_TYPES].accept : undefined}
                />
              </label>
            </p>
            {file && (
              <p className="mt-2 text-sm text-gray-500">
                Selected: {file.name}
              </p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-500">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || !selectedType}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-pink-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
