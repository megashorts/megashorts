// src/app/(main)/admin/agency/components/search/ReferralStructureView.tsx

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReferralNode {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  userRole: number;
  agencyRoles: any[];
  childrenCount: number;
  children: ReferralNode[];
}

interface ReferralStructureViewProps {
  data: ReferralNode;
}

export default function ReferralStructureView({ data }: ReferralStructureViewProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-auto max-h-[600px] border rounded-md p-4">
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
  const [expanded, setExpanded] = useState(level === 0);
  const [children, setChildren] = useState<ReferralNode[]>(node.children || []);
  const [loading, setLoading] = useState(false);
  
  const getRoleLabel = (userRole: number) => {
    switch (userRole) {
      case 50: return "본부마스터";
      case 40: return "운영자";
      case 30: return "에이전시마스터";
      case 20: return "에이전시멤버";
      default: return "일반회원";
    }
  };

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
  
  return (
    <div className="ml-4">
      <div className="flex items-center space-x-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          disabled={node.childrenCount === 0 || loading}
        >
          {loading ? "..." : node.childrenCount > 0 ? (expanded ? "−" : "+") : "○"}
        </Button>
        <div
          className="font-medium"
          title={`${node.displayName || node.username}${node.email ? ` / ${node.email}` : ""}`}
        >
          {node.username} ({getRoleLabel(node.userRole)})
        </div>
        <div className="text-xs text-muted-foreground">하위 {node.childrenCount}명</div>
        {node.agencyRoles.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {node.agencyRoles.map((role, index) => (
              <span key={index}>
                {index > 0 && ", "}
                레벨 {role.level} ({role.commissionRate}%)
              </span>
            ))}
          </div>
        )}
      </div>
      
      {expanded && children.length > 0 && (
        <div className="border-l pl-4">
          {children.map((child, index) => (
            <ReferralTreeNode key={child.userId || index} node={child} level={level + 1} rootUserId={rootUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
