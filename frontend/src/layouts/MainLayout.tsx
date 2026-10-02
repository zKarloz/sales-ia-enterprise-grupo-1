import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-layout__main">
        <Topbar />

        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}