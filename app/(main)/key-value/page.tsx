'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import KeyValueCard from '@/app/components/KeyValueCard';
import KeyValueModal from '@/app/components/modal/KeyValueModal';

interface KeyValue {
    id: string;
    name: string;
    values: string[];
  }
  
export default function KeyValuePage() {
  const [keyValues, setKeyValues] = useState<KeyValue[]>([
    {
      id: '1',
      name: 'Status',
      values: ['Active', 'Inactive', 'Pending', 'Archived', 'Draft', 'Published'],
    },
    // Add more sample data as needed
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeyValue, setSelectedKeyValue] = useState<KeyValue | null>(null);

  const handleEdit = (keyValue: KeyValue) => {
    setSelectedKeyValue(keyValue);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setKeyValues(keyValues.filter(kv => kv.id !== id));
  };

  const handleAddNew = () => {
    setSelectedKeyValue(null);
    setIsModalOpen(true);
  };

  const handleSave = (updatedKeyValue: Omit<KeyValue, 'id' | 'createdAt' | 'lastModified'>) => {
    if (selectedKeyValue) {
      // Update existing key-value pair
      setKeyValues(keyValues.map(kv => 
        kv.id === selectedKeyValue.id 
          ? { ...kv, ...updatedKeyValue }
          : kv
      ));
    } else {
      // Add new key-value pair
      setKeyValues([
        ...keyValues,
        {
          id: Date.now().toString(), // simple unique id
          ...updatedKeyValue
        }
      ]);
    }
    setIsModalOpen(false);
    setSelectedKeyValue(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Key Value Pairs</h1>
        <button
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          onClick={handleAddNew}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Key
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {keyValues.map((keyValue) => (
          <KeyValueCard
            key={keyValue.id}
            keyValue={keyValue}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {keyValues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No key-value pairs found. Create one to get started.</p>
        </div>
      )}

      <KeyValueModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedKeyValue(null);
        }}
        keyValue={selectedKeyValue}
        onSave={handleSave}
      />
    </div>
  );
}
