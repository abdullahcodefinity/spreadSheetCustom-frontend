
const Url = {
  //Sheet
  getAllSheets: (search: string | null = null) =>
    `sheets?search=${search}`,
  createSheet: "sheets",
  deleteSheet: (id: number) => `sheets/${id}`,
  shareSheet: (id: number) => `/sheets/${id}/`,
  getSheet: (id: number) => `/sheets/${id}`,

  addNewRow: '/sheet-data',
  updateRow: (id: number, row: number) => `/sheet-data/${id}/position/${row}`,
  deleteRow: (id: number, row: number) => `/sheet-data/${id}/position/${row}`,
  
  updateColumns: (id: number) => `/sheets/${id}/columns`,
  moveColumns: (id: number) => `/sheets/${id}/columns/move`,
  moveRow: (id: number) => `/sheet-data/${id}/move`,



  //Users
  getAllUsers: (search: string | null = null) =>
    search ? `users?search=${search}` : 'auth/users',
  deleteUser: `users/`,
  createUser: "users",
  getUser: (id: number) => `users/${id}`,
  updateUser: (id: number) => `users/${id}`,


  //Auth
  LoginSuperAdmin: "auth/admin/sign-in",
  LoginUser: "auth/login",
  ForgotPassword: "auth/reset-password",
  ForgotPasswordAdmin: "auth/admin/reset-password",
  ResetPassword: (token: string) => `auth/reset-password/${token}`,
  ResetPasswordAdmin: (token: string) => `auth/admin/reset-password/${token}`
};

export default Url;