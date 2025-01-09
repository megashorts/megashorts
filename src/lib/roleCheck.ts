import { USER_ROLES, UserRoleNumber } from './types';

export function hasPermission(userRole: UserRoleNumber, requiredRole: UserRoleNumber): boolean {
  return userRole >= requiredRole;
}

export function canManageContent(userRole: UserRoleNumber): boolean {
  return userRole >= USER_ROLES.CREATOR;
}

// import { USER_ROLES } from './roleType';

// export function canAccessAdminPanel(userRole: number): boolean {
//   // 로깅 추가가능
//   // console.log(`Checking admin access for role: ${userRole}`);
  
//   // 추가 조건 쉽게 삽입 가능
//   // const isWithinBusinessHours = checkBusinessHours();
//   return userRole >= USER_ROLES.ADMIN
// }

// export function canCreateContent(userRole: number): boolean {
//   return userRole >= USER_ROLES.CREATOR
// }

// export function isAdmin(userRole: number): boolean {
//   return userRole >= USER_ROLES.ADMIN
// }

// // // 구현 예시
// // // 컴포넌트나 API 라우트에서 사용
// // import { canAccessAdminPanel } from '@/utils/roleCheck';

// // function AdminDashboard({ user }) {
// //   // 관리자 이상의 권한만 접근 가능
// //   if (!canAccessAdminPanel(user.role)) {
// //     return <AccessDeniedComponent />;
// //   }

// //   return (
// //     <div>
// //       <h1>관리자 대시보드</h1>
// //       {/* 관리자 전용 컨텐츠 */}
// //     </div>
// //   );
// // }

// // // API 라우트 예시
// // export async function POST(req) {
// //   const user = await getCurrentUser();
  
// //   if (!canCreateContent(user.role)) {
// //     return NextResponse.json({ 
// //       error: '컨텐츠 생성 권한이 없습니다.' 
// //     }, { status: 403 });
// //   }

// //   // 컨텐츠 생성 로직
// // }