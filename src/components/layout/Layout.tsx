import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

const Layout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4">
        {/* 👇 Child routes will render here */}
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
