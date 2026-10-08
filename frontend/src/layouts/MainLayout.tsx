import {
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


export default function MainLayout() {
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);


  return (
    <div
      className="
        min-h-screen
        bg-slate-50
        text-slate-900
        transition-colors
        duration-200
        dark:bg-slate-950
        dark:text-slate-100
      "
    >
      <Sidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="min-h-screen lg:pl-64">
        <Topbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main
          className="
            mx-auto
            w-full
            max-w-[1600px]
            p-4
            sm:p-6
            lg:p-8
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}