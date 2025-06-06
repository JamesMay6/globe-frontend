import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const useToast = () => ({
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  warning: (msg) => toast.warn(msg),
});

export default ToastContainer;