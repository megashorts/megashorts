"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/components/SessionProvider";
import { USER_ROLE, USER_ROLE_NAME_EN } from "@/lib/constants";
import kyInstance from "@/lib/ky";
import {
  CheckCircle2,
  Eye,
  Gift,
  KeyRound,
  LineChart,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  User,
  UserCog,
} from "lucide-react";

interface UserSubscription {
  status: string;
  type: string;
  currentPeriodEnd: string | Date;
}

interface UserRow {
  id: string;
  email: string | null;
  username: string;
  displayName: string;
  userRole: number;
  points: number;
  coins: number;
  emailVerified: boolean;
  createdAt: string | Date;
  subscription: UserSubscription | null;
}

interface UserListResponse {
  success: boolean;
  users: UserRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserDetailResponse {
  success: boolean;
  user: {
    id: string;
    email: string | null;
    username: string;
    displayName: string;
    userRole: number;
    points: number;
    coins: number;
    emailVerified: boolean;
    adultauth: boolean;
    loginAttempts: number;
    blockedUntil: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    referredBy: string | null;
    referrer: {
      id: string;
      displayName: string;
      email: string | null;
    } | null;
    subscription: UserSubscription | null;
    activeSessionCount: number;
    canManageActions: boolean;
    canChangePassword: boolean;
    hasSocialLogin: boolean;
    hasPassword: boolean;
  };
}

const PAGE_SIZES = [10, 20, 50];

const roleOptions = Object.entries(USER_ROLE_NAME_EN)
  .map(([value, label]) => ({ value: Number(value), label }))
  .sort((a, b) => a.value - b.value);

const editableRoleOptions = roleOptions.filter((role) => role.value >= USER_ROLE.USER);

function getRoleLabel(role: number) {
  return (USER_ROLE_NAME_EN as Record<number, string>)[role] || `Role ${role}`;
}

function formatDateValue(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "yyyy-MM-dd HH:mm");
}

function getSubscriptionDisplay(subscription: UserSubscription | null) {
  if (!subscription) {
    return { label: "Free", ledClass: "led-red" };
  }

  const status = subscription.status?.toLowerCase() ?? "";
  const type = subscription.type?.toLowerCase() ?? "free";
  const label = type === "free" ? "Free" : type[0].toUpperCase() + type.slice(1);

  if (status === "active" && type !== "free") {
    return { label, ledClass: "led-blue" };
  }

  return { label: "Free", ledClass: "led-red" };
}

function getDefaultSubscriptionType(subscription: UserSubscription | null) {
  if (!subscription) return "free";
  const status = subscription.status?.toLowerCase();
  const type = subscription.type?.toLowerCase();
  if (status !== "active") return "free";
  if (type === "basic" || type === "premium") return type;
  return "free";
}

function getEarningsHref(targetUser: UserRow) {
  const path = targetUser.userRole >= USER_ROLE.CREATOR_Lv1 && targetUser.userRole < USER_ROLE.TEAM_MEMBER
    ? "/usermenu/earnings"
    : "/usermenu/agency-earnings";

  return `${path}?tab=statistics&targetUserId=${encodeURIComponent(targetUser.id)}`;
}

function getProfileHref(targetUser: UserRow) {
  return `/usermenu/users/${encodeURIComponent(targetUser.username)}`;
}

function UserActionItems({ targetUser, onView }: { targetUser: UserRow; onView: () => void }) {
  return (
    <>
      <DropdownMenuItem onClick={onView}>
        <Eye className="mr-2 h-4 w-4" />
        View
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href={getEarningsHref(targetUser)}>
          <LineChart className="mr-2 h-4 w-4" />
          Earnings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href={getProfileHref(targetUser)}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </Link>
      </DropdownMenuItem>
    </>
  );
}

export default function UserManagementClient() {
  const { user: sessionUser } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const [grantType, setGrantType] = useState<"POINTS" | "COINS">("POINTS");
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");

  const [editDisplayName, setEditDisplayName] = useState("");
  const [editRole, setEditRole] = useState<string>(String(USER_ROLE.USER));
  const [editEmailVerified, setEditEmailVerified] = useState(false);
  const [editSubscriptionType, setEditSubscriptionType] = useState("free");

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const roleFilterLabel = useMemo(() => {
    if (selectedRoles.length === 0) return "Role";
    if (selectedRoles.length === 1) return getRoleLabel(selectedRoles[0]);
    return `Role ${selectedRoles.length}`;
  }, [selectedRoles]);

  const listQuery = useQuery<UserListResponse>({
    queryKey: ["admin-user-management", keyword, selectedRoles, page, pageSize],
    queryFn: () =>
      kyInstance
        .get("/api/admin/users", {
          searchParams: {
            ...(keyword ? { q: keyword } : {}),
            ...(selectedRoles.length > 0 ? { roles: selectedRoles.join(",") } : {}),
            page,
            limit: pageSize,
          },
        })
        .json<UserListResponse>(),
  });

  const detailQuery = useQuery<UserDetailResponse>({
    queryKey: ["admin-user-management-detail", selectedUserId],
    enabled: Boolean(selectedUserId),
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${selectedUserId}`);
      const data = (await response.json()) as UserDetailResponse & {
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load user details.");
      }

      return data;
    },
  });

  const selectedUser = detailQuery.data?.user;
  const detailErrorMessage =
    detailQuery.error instanceof Error
      ? detailQuery.error.message
      : "Failed to load user details.";

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-user-management"] }),
      queryClient.invalidateQueries({
        queryKey: ["admin-user-management-detail", selectedUserId],
      }),
    ]);
  };

  const openDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setGrantDialogOpen(false);
    setEditDialogOpen(false);
    setPasswordDialogOpen(false);
  };

  const closeAllDialogs = () => {
    setSelectedUserId(null);
    setGrantDialogOpen(false);
    setEditDialogOpen(false);
    setPasswordDialogOpen(false);
  };

  const grantMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      const amount = Number(grantAmount);
      await kyInstance.post(`/api/admin/users/${selectedUserId}/grant`, {
        json: {
          type: grantType,
          amount,
          reason: grantReason,
        },
      });
    },
    onSuccess: async () => {
      toast({
        description: "Grant completed.",
        duration: 1500,
      });
      setGrantAmount("");
      setGrantReason("");
      setGrantDialogOpen(false);
      await invalidateAll();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to process grant.",
        duration: 2000,
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      await kyInstance.patch(`/api/admin/users/${selectedUserId}`, {
        json: {
          displayName: editDisplayName,
          userRole: Number(editRole),
          emailVerified: editEmailVerified,
          subscriptionType: editSubscriptionType,
        },
      });
    },
    onSuccess: async () => {
      toast({
        description: "User information updated.",
        duration: 1500,
      });
      setEditDialogOpen(false);
      await invalidateAll();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to update user.",
        duration: 2000,
      });
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      await kyInstance.post(`/api/admin/users/${selectedUserId}/force-logout`);
    },
    onSuccess: async () => {
      toast({
        description: "Active sessions logged out.",
        duration: 1500,
      });
      await invalidateAll();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Failed to force logout.",
        duration: 2000,
      });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      await kyInstance.post(`/api/admin/users/${selectedUserId}/password`, {
        json: {
          newPassword,
        },
      });
    },
    onSuccess: async () => {
      toast({
        description: "Password changed.",
        duration: 1500,
      });
      setNewPassword("");
      setNewPasswordConfirm("");
      setPasswordDialogOpen(false);
      await invalidateAll();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Failed to change password.",
        duration: 2000,
      });
    },
  });

  const handleSearchSubmit = () => {
    setPage(1);
    setKeyword(keywordInput.trim());
  };

  const toggleRoleFilter = (roleValue: number) => {
    setPage(1);
    setSelectedRoles((prev) =>
      prev.includes(roleValue)
        ? prev.filter((value) => value !== roleValue)
        : [...prev, roleValue],
    );
  };

  const openEditModal = () => {
    if (!selectedUser) return;
    setEditDisplayName(selectedUser.displayName);
    setEditRole(String(selectedUser.userRole));
    setEditEmailVerified(Boolean(selectedUser.emailVerified));
    setEditSubscriptionType(getDefaultSubscriptionType(selectedUser.subscription));
    setEditDialogOpen(true);
  };

  const subscriptionForDetail = getSubscriptionDisplay(selectedUser?.subscription ?? null);
  const total = listQuery.data?.pagination.total ?? 0;
  const totalPages = listQuery.data?.pagination.totalPages ?? 1;
  const currentPage = listQuery.data?.pagination.page ?? page;

  return (
    <div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="flex min-w-[250px] flex-1 items-center gap-2">
            <Input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              placeholder="Search by email or name"
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 px-3"
              onClick={handleSearchSubmit}
            >
              <Search className="mr-1 h-4 w-4" />
              Search
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 min-w-[110px] justify-start">
                <UserCog className="mr-2 h-4 w-4" />
                {roleFilterLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Role Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {roleOptions.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => toggleRoleFilter(role.value)}
                >
                  {role.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 모바일 화면용 카드 리스트 */}
      {listQuery.isLoading ? (
        <div className="sm:hidden py-10 text-center text-muted-foreground border rounded-md">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : listQuery.data?.users.length ? (
        <div className="sm:hidden space-y-3">
          {listQuery.data.users.map((targetUser) => {
            const subscription = getSubscriptionDisplay(targetUser.subscription);
            return (
              <div key={targetUser.id} className="p-3 border rounded-lg bg-card space-y-2 shadow-xs">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{targetUser.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{targetUser.email || "-"}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <UserActionItems targetUser={targetUser} onView={() => openDetail(targetUser.id)} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2 items-center text-[11px]">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{getRoleLabel(targetUser.userRole)}</Badge>
                  <div className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                    <span className={`led-indicator ${subscription.ledClass} h-1.5 w-1.5`} />
                    <span className="font-medium text-[10px]">{subscription.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Points: </span>
                    <span className="font-semibold">{Number(targetUser.points).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Coins: </span>
                    <span className="font-semibold">{Number(targetUser.coins).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="sm:hidden py-8 text-center text-muted-foreground border rounded-lg">
          No user data found.
        </div>
      )}

      {/* 데스크탑 화면용 테이블 */}
      <div className="hidden sm:block overflow-x-auto rounded-md border">
        <Table className="min-w-[600px] md:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px] max-w-[220px]">Email</TableHead>
              <TableHead className="min-w-[100px] max-w-[180px]">Name</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden sm:table-cell">Subscription</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="hidden md:table-cell text-right">Coins</TableHead>
              <TableHead className="w-[80px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : listQuery.data?.users.length ? (
              listQuery.data.users.map((targetUser) => {
                const subscription = getSubscriptionDisplay(targetUser.subscription);
                return (
                  <TableRow key={targetUser.id}>
                    <TableCell className="max-w-[120px] sm:max-w-[220px] truncate break-all">
                      {targetUser.email || "-"}
                    </TableCell>
                    <TableCell className="max-w-[100px] sm:max-w-[180px] truncate break-all">
                      {targetUser.displayName}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{getRoleLabel(targetUser.userRole)}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="inline-flex items-center gap-2">
                        <span className={`led-indicator ${subscription.ledClass}`} />
                        <span className="font-medium">{subscription.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(targetUser.points).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {Number(targetUser.coins).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <UserActionItems targetUser={targetUser} onView={() => openDetail(targetUser.id)} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No user data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {(listQuery.data?.users.length ?? 0)} of {total} users
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || listQuery.isFetching}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </Button>
          <span className="min-w-[90px] text-center text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || listQuery.isFetching}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(selectedUserId)} onOpenChange={(open) => (!open ? closeAllDialogs() : undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
          {detailQuery.isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : selectedUser ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">User Details</DialogTitle>
                <DialogDescription>
                  @{selectedUser.username} · {selectedUser.email || "-"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm md:grid-cols-2">
                <div className="space-y-2">
                  <p><span className="text-muted-foreground">Name</span><br />{selectedUser.displayName}</p>
                  <p><span className="text-muted-foreground">Role</span><br /><Badge variant="outline">{getRoleLabel(selectedUser.userRole)}</Badge></p>
                  <p><span className="text-muted-foreground">Subscription</span><br />
                    <span className="inline-flex items-center gap-2">
                      <span className={`led-indicator ${subscriptionForDetail.ledClass}`} />
                      <span className="font-medium">{subscriptionForDetail.label}</span>
                    </span>
                  </p>
                  <p><span className="text-muted-foreground">Next Renewal</span><br />
                    {selectedUser.subscription?.currentPeriodEnd
                      ? formatDateValue(selectedUser.subscription.currentPeriodEnd)
                      : "-"}
                  </p>
                  <p><span className="text-muted-foreground">Points / Coins</span><br />
                    {selectedUser.points.toLocaleString()} / {selectedUser.coins.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <p>
                    <span className="text-muted-foreground">Email Verified</span><br />
                    <span className="inline-flex items-center gap-2">
                      <span className={`led-indicator ${selectedUser.emailVerified ? "led-blue" : "led-red"}`} />
                      {selectedUser.emailVerified ? "Yes" : "No"}
                    </span>
                  </p>
                  <p><span className="text-muted-foreground">2FA Enabled</span><br />No</p>
                  <p><span className="text-muted-foreground">Login Attempts</span><br />{selectedUser.loginAttempts}</p>
                  <p><span className="text-muted-foreground">Active Sessions</span><br />{selectedUser.activeSessionCount}</p>
                  <p><span className="text-muted-foreground">Referred By</span><br />{selectedUser.referrer?.displayName || "None"}</p>
                  <p><span className="text-muted-foreground">Updated At</span><br />{formatDateValue(selectedUser.updatedAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                {selectedUser.canManageActions && (
                  <Button variant="outline" onClick={() => setGrantDialogOpen(true)}>
                    <Gift className="mr-2 h-4 w-4" />
                    Grant
                  </Button>
                )}
                {selectedUser.canManageActions && (
                  <Button variant="outline" onClick={openEditModal}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {selectedUser.canManageActions && selectedUser.canChangePassword && (
                  <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Password
                  </Button>
                )}
                {selectedUser.canManageActions &&
                  sessionUser?.userRole &&
                  sessionUser.userRole >= USER_ROLE.OPERATION3 && (
                  <Button
                    variant="destructive"
                    onClick={() => forceLogoutMutation.mutate()}
                    disabled={forceLogoutMutation.isPending}
                  >
                    {forceLogoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Force Logout
                  </Button>
                )}
              </div>
            </>
          ) : detailQuery.isError ? (
            <div className="py-10 text-center">
              <p className="text-sm text-destructive">{detailErrorMessage}</p>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">User information not found.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Grant Points / Coins</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={grantType} onValueChange={(value: "POINTS" | "COINS") => setGrantType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POINTS">Points</SelectItem>
                  <SelectItem value="COINS">Coins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                value={grantAmount}
                onChange={(event) => setGrantAmount(event.target.value)}
                placeholder="Enter amount"
                type="number"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={grantReason}
                onChange={(event) => setGrantReason(event.target.value)}
                placeholder="e.g. Admin adjustment"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => grantMutation.mutate()}
                disabled={
                  grantMutation.isPending ||
                  !grantAmount ||
                  Number(grantAmount) <= 0
                }
              >
                {grantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Grant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Edit user account details. Changes apply immediately upon saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editDisplayName}
                onChange={(event) => setEditDisplayName(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editableRoleOptions.map((role) => (
                      <SelectItem key={role.value} value={String(role.value)}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subscription Type</Label>
                <Select value={editSubscriptionType} onValueChange={setEditSubscriptionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">free</SelectItem>
                    <SelectItem value="basic">basic</SelectItem>
                    <SelectItem value="premium">premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="email-verified-check"
                checked={editEmailVerified}
                onCheckedChange={(checked) => setEditEmailVerified(Boolean(checked))}
              />
              <Label htmlFor="email-verified-check">Email Verified</Label>
            </div>

            <div className="flex justify-between gap-2 border-t pt-4">
              <div className="text-sm text-destructive">
                <p className="font-semibold">Force Logout (Blacklist Sessions)</p>
                <p className="text-muted-foreground">Invalidates all active sessions.</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => forceLogoutMutation.mutate()}
                disabled={forceLogoutMutation.isPending}
              >
                {forceLogoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Force Logout
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => editMutation.mutate()}
                disabled={editMutation.isPending || editDisplayName.trim().length < 2}
              >
                {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Only administrator level (OPERATION3+) can perform this. Target sessions will terminate immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={newPasswordConfirm}
                onChange={(event) => setNewPasswordConfirm(event.target.value)}
              />
            </div>
            {newPassword.length > 0 && newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm && (
              <p className="text-sm text-destructive">Passwords do not match.</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => passwordMutation.mutate()}
                disabled={
                  passwordMutation.isPending ||
                  newPassword.length < 8 ||
                  newPassword !== newPasswordConfirm
                }
              >
                {passwordMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
