interface Permission {
  id: number;
  userId: number;
  permissionId: number;
  permission: {
    id: number;
    action: 'create' | 'read' | 'update' | 'delete';
    subject: 'Sheet';
  }
}

interface User {
  id: number;
  name: string;
  email: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

interface UserTableProps {
  filteredUsers: User[];
  handleEdit: (userId: number) => void;
  handleDelete: (userId: number, userName: string) => void;
  isDeleting: boolean;
  getPermissionLabel: (permission: { action: string; subject: string }) => string;
  formatDate: (date: string) => string;
}

export default function UserTable({
  filteredUsers,
  handleEdit,
  handleDelete,
  isDeleting,
  getPermissionLabel,
  formatDate
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
              Permissions
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
                    {user.permissions.map((permission, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2.5 py-0.5  rounded-full text-xs font-medium bg-blue-200`}
                      >
                        {getPermissionLabel(permission.permission)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(user.createdAt)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(user.updatedAt)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="text-blue-600 hover:text-blue-900 focus:outline-none"
                      title="Edit user"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={isDeleting}
                      className={`text-red-600 hover:text-red-900 focus:outline-none ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Delete user"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
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
