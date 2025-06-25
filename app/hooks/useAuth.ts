import { useContext } from "react";
import { AuthContext } from "../context";
import keys from "../common/keys";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}

const useAuth = () => {
  const { token, setToken, currentUser, setCurrentUser } =
    useContext(AuthContext);

  const authenticateUser = (user: User, jwt: string): void => {

    setCurrentUser(user);
    setToken(jwt);
    localStorage.setItem(keys.jwttoken, jwt);
    localStorage.setItem(keys.user, JSON.stringify(user));
    
    // Set user cookie for middleware access
    document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
  };



  const logout = (): void => {
    setCurrentUser(undefined);
    setToken("");
    localStorage.removeItem(keys.jwttoken);
    localStorage.removeItem(keys.user);
    
    // Remove user cookie
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };


  const checkPermission = (user: any, action: string, subject: string): boolean => {
    const haspermission = user?.permissions?.some(
      (permission: { action: string; subject: string }) => 
        permission.action.toLowerCase() === action.toLowerCase() && permission.subject.toLowerCase() === subject.toLowerCase()
    );
    return haspermission;
  };

  const updateUser = (user: User): void => {
    setCurrentUser(user);
    localStorage.setItem(keys.user, JSON.stringify(user));
    
    // Update user cookie
    document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
  };

  return { authenticateUser, logout, updateUser, currentUser, checkPermission };
};

export default useAuth;