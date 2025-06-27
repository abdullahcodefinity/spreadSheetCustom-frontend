import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Key } from 'lucide-react';
import { KeyValueModalProps } from '@/app/types';



const KeyValueModal: React.FC<KeyValueModalProps> = ({
  isOpen,
  onClose,
  keyValue,
  onSave
}) => {
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>(['']);
  const [currentValue, setCurrentValue] = useState('');

  useEffect(() => {
    if (keyValue) {
      setName(keyValue.name);
      setValues(keyValue.values.length > 0 ? keyValue.values : ['']);
    } else {
      setName('');
      setValues(['']);
    }
    setCurrentValue('');
  }, [keyValue, isOpen]);

  if (!isOpen) return null;

  const handleAddValue = () => {
    if (currentValue.trim() && !values.includes(currentValue.trim())) {
      setValues([...values.filter(v => v.trim()), currentValue.trim()]);
      setCurrentValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValue();
    }
  };

  const handleSave = () => {
    if (name.trim() && values.some(v => v.trim())) {
      const filteredValues = values.filter(v => v.trim()).map(v => v.trim());
      onSave({
        name: name.trim(),
        values: filteredValues,
      });
      onClose();
    }
  };

  const isEditing = !!keyValue;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Key-Value Pair' : 'Create Key-Value Pair'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Update your key-value configuration' : 'Define a new key with multiple values'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Key Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter key name (e.g., Department Categories)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Values */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Values
            </label>
            
            {/* Add New Value */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a value and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleAddValue}
                disabled={!currentValue.trim() || values.includes(currentValue.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Values List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {values.filter(v => v.trim()).map((value, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={() => handleRemoveValue(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {values.filter(v => v.trim()).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No values added yet</p>
                <p className="text-sm">Add values using the input field above</p>
              </div>
            )}
          </div>

          {/* Preview */}
          {values.filter(v => v.trim()).length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {values.filter(v => v.trim()).map((value, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-pink-100 text-blue-800"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !values.some(v => v.trim())}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-pink-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Update' : 'Create'} Key-Value Pair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyValueModal;