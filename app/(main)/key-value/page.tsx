'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import KeyValueCard from '@/app/components/KeyValueCard';
import KeyValueModal from '@/app/components/modal/KeyValueModal';
import useFetchData from '@/app/hooks/useFetchData';
import { Url } from '@/src/api';
import useUpdateData from '@/app/hooks/ useUpdateData';
import usePostData from '@/app/hooks/ usePostData';
import useDelete from '@/app/hooks/useDelete';
import { DeleteModal } from '@/app/components/modal/DeleteModal';
import { KeyValue } from '@/app/types';


export default function KeyValuePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKeyValue, setSelectedKeyValue] = useState<KeyValue | null>(null);
    const [isShow, setIsShow] = useState(false);
    const [deletedId, setDeletedId] = useState<number | null>(null);



    // Create
    const { mutate: createValueSet, refresh } = usePostData({
        URL: 'value-sets',
        mode: 'post',
        link: '',
        formData: false,
        isNavigate: false
    });

    // Update
    const { mutate: updateValueSet, refreshUpdate } = useUpdateData({
        URL: Url.getValueSet(Number(selectedKeyValue?.id)),
        link: '',
        isUpdate: false,
        formData: false,
    });

    // Delete
    const { mutate: deleteValueSet } = useDelete({
        URL: Url.getValueSet(Number(deletedId)),
        key: ['valueSets'],
    });

    const { data: valueSets = [], isLoading: isLoadingData, status } = useFetchData({
        URL: Url.getAllValueSets(),
        key: ['valueSets', refreshUpdate, refresh],
        enabled: true
    });

    const handleEdit = (keyValue: KeyValue) => {
        setSelectedKeyValue(keyValue);
        setIsModalOpen(true);
    };

    const handleDeleteModal = (id: number) => {
        setIsShow(true)
        setDeletedId(id)
    };

    const handleDelete = () => {
        if (deletedId) {
            deleteValueSet(null);
            setIsShow(false);
        }
    };



    const handleAddNew = () => {
        setSelectedKeyValue(null);
        setIsModalOpen(true);
    };

    const handleSave = (updatedKeyValue: Omit<KeyValue, 'id' | 'createdAt' | 'lastModified'>) => {
        if (selectedKeyValue) {
            // Update existing key-value pair
            updateValueSet(updatedKeyValue);
        } else {
            // Add new key-value pair
            createValueSet(updatedKeyValue);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <DeleteModal
                agreeFunction={handleDelete}
                title="Delete Key Value Set?"
                description="Are you sure you want to delete Key Value Set?"
                isShow={isShow}
                setIsShow={setIsShow}
            />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Key Value Pairs</h1>
                <button
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={handleAddNew}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Key
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {valueSets?.map((keyValue: KeyValue) => (
                    <KeyValueCard
                        key={keyValue.id}
                        keyValue={keyValue}
                        onEdit={handleEdit}
                        onDelete={handleDeleteModal}
                    />
                ))}
            </div>

            {valueSets?.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No key-value pairs found. Create one to get started.</p>
                </div>
            )}

            <KeyValueModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);

                }}
                keyValue={selectedKeyValue}
                onSave={handleSave}
            />
        </div>
    );
}
