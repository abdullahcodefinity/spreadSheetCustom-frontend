import toast, { ToastOptions } from "react-hot-toast";
import { ToastHook } from "../types";

const useToast = (): ToastHook => {
  const successToast = (message: string): void => {
    
    toast.remove();
    toast.success(message, {
      position: "top-center",
      style: {marginTop: '50px'},

      duration: 5000,
    });
  };

  const errorToast = (message: string): void => {
    toast.remove();
    toast.error(message, {
      position: "top-center",
      style: {marginTop: '50px'},

    });
  };

  const warningToast = (message: string): void => {
    const warningOptions: ToastOptions = {
      duration: 8000,
      position: 'top-center',
      // Styling
      style: {top: '50px'},
      className: '',
      // Custom Icon
      icon: '⚠️',
      // Change colors of success/error/loading icon
      iconTheme: {
        primary: '#000',
        secondary: '#fff',
      },
      // Aria
      ariaProps: {
        role: 'status',
        'aria-live': 'polite',
      },
    };

    toast(message, warningOptions);
  };

  return {
    successToast,
    errorToast,
    warningToast
  };
};

export default useToast;
