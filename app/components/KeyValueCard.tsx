import React from "react";

import { Key, Edit, Trash2 } from "lucide-react";
import { KeyValueCardProps } from "../types";

const KeyValueCard: React.FC<KeyValueCardProps> = ({
 keyValue,
 onEdit,
 onDelete,
}) => {
 return (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
   <div className="flex items-start justify-between mb-4">
    <div className="flex items-center space-x-3">
     <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-800 rounded-lg flex items-center justify-center">
      <Key className="w-5 h-5 text-white" />
     </div>
     <div>
      <h3 className="font-semibold text-gray-900 text-lg">{keyValue.name}</h3>
      <p className="text-sm text-gray-600">{keyValue.values.length} values</p>
     </div>
    </div>

    <div className="flex items-center space-x-2">
     <button
      onClick={() => onEdit(keyValue)}
      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
     >
      <Edit className="w-4 h-4" />
     </button>
     <button
      onClick={() => onDelete(Number(keyValue.id))}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
     >
      <Trash2 className="w-4 h-4" />
     </button>
    </div>
   </div>

   <div className="mb-4">
    <div className="flex flex-wrap gap-2">
     {keyValue.values.slice(0, 6).map((value, index) => (
      <span
       key={index}
       className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-green-100 text-blue-800"
      >
       {value}
      </span>
     ))}
     {keyValue.values.length > 6 && (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
       +{keyValue.values.length - 6} more
      </span>
     )}
    </div>
   </div>
  </div>
 );
};

export default KeyValueCard;
