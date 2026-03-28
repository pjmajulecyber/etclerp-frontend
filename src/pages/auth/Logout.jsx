import React, { useEffect } from "react";
import { useAuth } from "./AuthProvider";

export default function Logout() {

  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      Signing out...
    </div>
  );
}


