import { USER_ROLE } from "@/lib/constants";

export function isCreatorRole(userRole: number | null | undefined) {
  return (
    typeof userRole === "number" &&
    userRole >= USER_ROLE.CREATOR_Lv1 &&
    userRole < USER_ROLE.TEAM_MEMBER
  );
}

export function isAgencyRole(userRole: number | null | undefined) {
  return (
    typeof userRole === "number" &&
    userRole >= USER_ROLE.TEAM_MEMBER &&
    userRole < USER_ROLE.OPERATION1
  );
}

export function isOperationsRole(userRole: number | null | undefined) {
  return typeof userRole === "number" && userRole >= USER_ROLE.OPERATION1;
}

export function canOpenCreatorEarnings(userRole: number | null | undefined) {
  return isCreatorRole(userRole) || isOperationsRole(userRole);
}

export function canOpenAgencyEarnings(userRole: number | null | undefined) {
  return isAgencyRole(userRole) || isOperationsRole(userRole);
}
