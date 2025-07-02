"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

import useFetchData from "@/app/hooks/useFetchData";
import useDelete from "@/app/hooks/useDelete";
import { DeleteModalState, SheetPermission, User } from "@/app/types";
import useUpdateData from "@/app/hooks/ useUpdateData";
import { Url } from "@/src/api";

export const useUserList = () => {
 const router = useRouter();
 const [sheetId, setSheetId] = useState<number>();
 const [sheetModal, setSheetModal] = useState({
  state: false,
  selectedUser: null,
 });
 const [searchQuery, setSearchQuery] = useState("");
 const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
 const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
  isShow: false,
  userId: null,
  userName: "",
 });

 const {
  mutate: deleteUser,
  isPending: isDeleting,
  refreshDelete,
 } = useDelete({
  URL: "/auth/users",
  key: ["users"],
 });


 const { mutate: removeAccess,refreshUpdate:refreshRemoveAccess } = useUpdateData({
  URL: Url.removeSheetAccess(Number(sheetId)),
  link: "",
  isUpdate: false,
  formData: false,
 });

 // Update sheet (for sharing)
 const { mutate: updateSheetPermission,refreshUpdate } = useUpdateData({
  URL: Url.updateSheetPermission(Number(sheetId)),
  link: "",
  isUpdate: false,
  formData: false,
 });

 const { data: usersData, isLoading } = useFetchData({
  URL: Url.getAllUsers(),
  key: ["users", refreshDelete,refreshUpdate,refreshRemoveAccess],
 });

 const users = usersData?.users || [];

 useEffect(() => {
  if (!users || !searchQuery) {
   setFilteredUsers(users || []);
   return;
  }

  const searchQueryLower = searchQuery.toLowerCase();
  const filtered = users.filter(
   (user: User) =>
    user.name.toLowerCase().includes(searchQueryLower) ||
    user.email.toLowerCase().includes(searchQueryLower)
  );
  setFilteredUsers(filtered);
 }, [searchQuery, users]);

 const handleEdit = (userId: number) => {
  router.push(`/users/${userId}?mode=edit`);
 };

 


 const handleDelete = (userId: number, userName: string) => {
  setDeleteModal({
   isShow: true,
   userId,
   userName,
  });
 };

 const confirmDelete = () => {
  if (deleteModal.userId) {
   deleteUser(deleteModal.userId);
  }
 };

 const getPermissionLabel = (permission: SheetPermission) => {
  const actionMap: Record<string, string> = {
   create: "Create",
   read: "View",
   update: "Update",
   delete: "Delete",
   addColumn: "Add Column",
   updateColumnHeader: "Update Column Header",
  };
  return actionMap[permission?.action] || permission?.action;
 };

 const formatDate = (dateString: string) => {
  return dayjs(dateString).format("DD/MM/YYYY");
 };


 const handleRemoveAccess = (
  sheetId: number
 ) => {
  console.log(sheetId,'SHEETUD')
  setSheetId(Number(sheetId));
  removeAccess({userId:sheetModal.selectedUser?.id || 0})
    setSheetModal({state:false,selectedUser:null})
 };

 const handleUpdateSheetPermissions = async ({
  sheetId,
  permissions,
 }: {
  sheetId: number;
  permissions: string[];
 }) => {
  setSheetId(Number(sheetId));
  updateSheetPermission({
   userId: sheetModal.selectedUser?.id || 0,
   permissions,
  });
 };

 return {
  searchQuery,
  sheetModal,
  setSearchQuery,
  handleUpdateSheetPermissions,
  filteredUsers,
  deleteModal,
  setDeleteModal,
  isDeleting,
  isLoading,
  setSheetModal,
  handleEdit,
  handleDelete,
  confirmDelete,
  getPermissionLabel,
  formatDate,
  handleRemoveAccess,
 };
};
