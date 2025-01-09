export const USER_ROLES = {
    GUEST: 1,
    USER: 5,
    CREATOR: 10,
    SALES: 15,
    MARKETING: 20,
    ADMIN: 25,
    SUPER_ADMIN: 30
  } as const;
  
  export type UserRoleLevel = typeof USER_ROLES[keyof typeof USER_ROLES];