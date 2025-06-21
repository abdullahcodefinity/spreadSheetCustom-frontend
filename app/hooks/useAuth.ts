import { useContext } from "react";
import { AuthContext } from "../context";
import keys from "../common/keys";

interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}

const useAuth = () => {
  const { token, setToken, currentUser, setCurrentUser } =
    useContext(AuthContext);

  const authenticateUser = (user: User, jwt: string): void => {
    console.log("authenticateUser", user, jwt);
    setCurrentUser(user);
    setToken(jwt);
    localStorage.setItem(keys.jwttoken, jwt);
    localStorage.setItem(keys.user, JSON.stringify(user));
  };

  const logout = (): void => {
    setCurrentUser(undefined);
    setToken("");
    localStorage.removeItem(keys.jwttoken);
    localStorage.removeItem(keys.user);
  };

  const updateUser = (user: User): void => {
    setCurrentUser(user);
    localStorage.setItem(keys.user, JSON.stringify(user));
  };

  return { authenticateUser, logout, updateUser, currentUser };
};

export default useAuth;