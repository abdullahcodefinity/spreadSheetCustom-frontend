import toast, { ToastOptions } from "react-hot-toast";
import { ToastHook } from "../types";

const useToast = (): ToastHook => {
  const successToast = (message: string): void => {
    
    toast.remove();
    toast.success(message, {
      position: "top-right",
      duration: 5000,
    });
  };

  const errorToast = (message: string): void => {
    toast.remove();
    toast.error(message, {
      position: "top-right",
    });
  };

  const warningToast = (message: string): void => {
    const warningOptions: ToastOptions = {
      duration: 8000,
      position: 'top-right',
      // Styling
      style: {top: '1040px'},
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
