import { validateRequest } from '@/auth';
import { redirect } from "next/navigation";
import MenuBar from "../MenuBar";
// import Navbar from "../Navbar";

import Footer from '@/components/footer';
import SessionProvider from '@/components/SessionProvider';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const session = await validateRequest();

  // if (!session.user) redirect("/login");

  return (
    // <SessionProvider value={session}>
      <div className="flex min-h-screen w-full flex-col">
      {children}
        {/* <div className="mx-auto flex w-full max-w-7xl grow gap-1 pt-1 sm:pt-3 md:gap-2">
          {children}
        </div> */}
      </div>
    // </SessionProvider>
  );
}

//   return (
//     <SessionProvider value={session}>
//       <div className="flex min-h-screen flex-col">
//         {/* <Navbar /> */}
//         <div className="mx-auto flex w-full max-w-7xl grow gap-2 pt-1 sm:pt-5 pr-5 md:pr-2 lg:ml-2 xl:ml-2">
//           <MenuBar className="relative hidden h-fit flex-none space-y-3 rounded-2xl bg-card px-3 py-5 shadow-sm sm:block lg:px-5 xl:w-64" />
//           {children}
//         </div>
//         <MenuBar className="sticky bottom-0 flex w-full justify-center gap-5 border-t bg-card p-3 sm:hidden" />
//       </div>
//     </SessionProvider>
//   );
// }
