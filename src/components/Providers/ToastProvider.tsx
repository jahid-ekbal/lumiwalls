"use client";

import { useTheme } from "next-themes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastProvider = () => {
  const { resolvedTheme } = useTheme();

  return (
    <ToastContainer
      position="bottom-right"
      autoClose={3500}
      newestOnTop={true}
      closeOnClick={true}
      theme={resolvedTheme === "light" ? "light" : "dark"}
    />
  );
};

export default ToastProvider;
