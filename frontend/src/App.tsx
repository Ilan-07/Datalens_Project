import React from "react";
import { BrowserRouter } from "react-router-dom";

import AppLayout from "@/app/layout";
import { AppRoutes } from "@/routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </BrowserRouter>
  );
}
