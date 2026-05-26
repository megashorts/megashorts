// src/app/(main)/admin/agency/components/search/ReferralStructureView.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface ReferralNode {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  userRole: number;
  agencyRoles: any[];
  canEditQualification?: boolean;
  editableRoles?: Array<{ value: number; label: string }>;
  childrenCount: number;
  children: ReferralNode[];
}

interface ReferralStructureViewProps {
  data: ReferralNode;
}

export default function ReferralStructureView({ data }: ReferralStructureViewProps) {
  return (
    <div className="space-y-2">
      <div className="max-h-[600px] overflow-auto rounded-md border p-3 md:p-4">
        <ReferralTreeNode node={data} level={0} rootUserId={data.userId} />
      </div>
    </div>
  );
}

interface ReferralTreeNodeProps {
  node: ReferralNode;
  level: number;
  rootUserId: string;
}

function ReferralTreeNode({ node, level, rootUserId }: ReferralTreeNodeProps) {
  const { toast } = useToast();
  const t = useTranslations("Earnings");
  const [expanded, setExpanded] = useState(level === 0);
  const [children, setChildren] = useState<ReferralNode[]>(node.children || []);
  const [loading, setLoading] = useState(false);
  const agencyRole = node.agencyRoles?.[0];
  const [roleValue, setRoleValue] = useState(String(agencyRole?.level || ""));
  const [savingRole, setSavingRole] = useState(false);

  const toggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (children.length === 0 && node.childrenCount > 0) {
      setLoading(true);
      try {
        const response = await fetch(`/api/agency/structure?userId=${rootUserId}&parentId=${node.userId}`);
        const result = await response.json();

        if (result.success && result.data?.children) {
          setChildren(result.data.children);
        }
      } finally {
        setLoading(false);
      }
    }

    setExpanded(true);
  };

  const handleRoleChange = async (nextRole: string) => {
    setSavingRole(true);
    try {
      const response = await fetch("/api/agency/structure/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: node.userId, qualificationLevel: Number(nextRole) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to update qualification");
      setRoleValue(nextRole);
      toast({ description: t("qualificationUpdated"), duration: 1600 });
    } catch (error) {
      toast({ description: String(error), variant: "destructive", duration: 1800 });
    } finally {
      setSavingRole(false);
    }
  };

  const displayName = node.displayName || node.username;
  const selectedQualification = (node.editableRoles || []).find((role) => String(role.value) === roleValue);
  const roleLabel = selectedQualification?.label || agencyRole?.label || `Level ${roleValue || agencyRole?.level || "-"}`;
  
  return (
    <div className={level > 0 ? "ml-3 md:ml-5" : ""}>
      <div className="mb-2 flex min-w-[280px] flex-wrap items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          disabled={node.childrenCount === 0 || loading}
          className="h-7 w-7 shrink-0 p-0"
        >
          {loading ? "..." : node.childrenCount > 0 ? (expanded ? "−" : "+") : "○"}
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="min-w-0 max-w-[220px] truncate text-left font-medium md:max-w-[280px]">
                {displayName}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
              <div className="space-y-1 text-xs">
                <div>ID: {node.userId}</div>
                <div>Username: {node.username}</div>
                {node.email && <div>Email: {node.email}</div>}
                <div>Platform role: {node.userRole}</div>
                <div>Agency qualification: {roleLabel}</div>
                {agencyRole?.masterId && <div>Team master: {agencyRole.masterId}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Badge variant="secondary" className="shrink-0">{roleLabel}</Badge>
        <span className="text-xs text-muted-foreground">Sub {node.childrenCount}</span>
        {agencyRole && (
          <span className="text-xs text-muted-foreground">
            Level {agencyRole.level} / {agencyRole.commissionRate}%
          </span>
        )}
        {node.canEditQualification && (
          <Select value={roleValue} onValueChange={handleRoleChange} disabled={savingRole}>
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(node.editableRoles || []).map((role) => (
                <SelectItem key={role.value} value={String(role.value)}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {expanded && children.length > 0 && (
        <div className="border-l pl-3 md:pl-4">
          {children.map((child, index) => (
            <ReferralTreeNode key={child.userId || index} node={child} level={level + 1} rootUserId={rootUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
