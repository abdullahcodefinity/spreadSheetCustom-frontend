import { Edit, Trash2 } from "lucide-react";
import { UserTableProps } from "../types";

export default function UserTable({
 filteredUsers,
 handleEdit,
 handleDelete,
 isDeleting,
 formatDate,
 setSheetModal,
}: UserTableProps) {
 return (
  <div className="overflow-x-auto">
   <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
     <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
       Name
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
       Email
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
       Sheets
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
       Created
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
       Updated
      </th>
      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
       Actions
      </th>
     </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
     {filteredUsers.length === 0 ? (
      <tr>
       <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
        No users found
       </td>
      </tr>
     ) : (
      filteredUsers.map((user) => (
       <tr key={user.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm font-medium text-gray-900">{user.name}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-500">{user.email}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="flex flex-wrap gap-2">
          {user?.sheets?.length > 0 ? (
           user?.sheets?.map((sheet: any, index: number) => (
            <div className="flex gap-1 items-center">
             <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-200 mr-2"
             >
              {sheet.sheetName}
             </span>
            </div>
           ))
          ) : (
           <span className="text-sm text-gray-500">N/A</span>
          )}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-500">
          {formatDate(user.createdAt)}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-500">
          {formatDate(user.updatedAt)}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
         <div className="flex justify-end gap-2">
          <button
           onClick={() => handleEdit(user.id)}
           className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
           title="Edit user"
          >
           <Edit className="w-4 h-4" />
          </button>
          <button
           onClick={() => handleDelete(user.id, user.name)}
           disabled={isDeleting}
           className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors${
            isDeleting ? "opacity-50 cursor-not-allowed" : ""
           }`}
           title="Delete user"
          >
           <Trash2 className="w-4 h-4" />
          </button>
          <button
           onClick={() => setSheetModal({ state: true, selectedUser: user })}
           className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
           title="Edit Sheet Permission"
          >
           <Edit className="w-4 h-4" />
          </button>
         </div>
        </td>
       </tr>
      ))
     )}
    </tbody>
   </table>
  </div>
 );
}
