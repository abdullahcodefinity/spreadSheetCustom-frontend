"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import useToast from "@/app/hooks/useToast";
import useFetchData from "@/app/hooks/useFetchData";
import useDelete from "@/app/hooks/useDelete";
import { DeleteModalState, SheetPermission, User } from "@/app/types";


export const useUserList = () => {
 const router = useRouter();

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

 const { data: usersData, isLoading } = useFetchData({
  URL: "/auth/users",
  key: ["users", refreshDelete],
  enabled: true,
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
  console.log("hello jee", permission);
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

 return {
  searchQuery,
  setSearchQuery,
  filteredUsers,
  deleteModal,
  setDeleteModal,
  isDeleting,
  isLoading,
  handleEdit,
  handleDelete,
  confirmDelete,
  getPermissionLabel,
  formatDate,
 };
};
