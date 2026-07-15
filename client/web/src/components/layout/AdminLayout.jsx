// // src/components/layout/AdminLayout.jsx
// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";
// import { auth } from "@/lib/auth";
// import { PageLoader } from "@/components/ui/Spinner";

// export default function AdminLayout({ children, pendingReports = 0 }) {

// const router = useRouter();

//   const token = auth.getToken();
//   const user = auth.getUser();

//   const hasSession = Boolean(token && user);
//   const isSuperAdmin = hasSession && auth.hasRole("super_admin");

//   useEffect(() => {
//     if (!hasSession) {
//       router.replace("/login");
//       return;
//     }

//     if (!isSuperAdmin) {
//       router.replace("/unauthorized");
//     }
//   }, [router, hasSession, isSuperAdmin]);

//   if (!hasSession || !isSuperAdmin) {
//     return <PageLoader />;
//   }


//   return (
//     <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F8FAF9" }}>
//       {/* Sidebar */}
//       <Sidebar pendingReports={pendingReports} />

//       {/* Main area */}
//       <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
//         {/* Topbar */}
//         <Topbar />

//         {/* Page content */}
//         <main className="flex-1 overflow-y-auto p-6">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }

//  below code allows normal user to login and lands on dashboard
// src/components/layout/AdminLayout.jsx
"use client";

import { Suspense } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout({ children, pendingReports = 0 }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F8FAF9" }}>
      {/* Sidebar */}
      <Suspense fallback={<div className="w-60" />}>
      <Sidebar pendingReports={pendingReports} /></Suspense>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}