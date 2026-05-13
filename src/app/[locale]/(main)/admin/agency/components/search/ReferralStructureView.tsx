// src/app/(main)/admin/agency/components/search/ReferralStructureView.tsx

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReferralNode {
  userId: string;
  username: string;
  userRole: number;
  agencyRoles: any[];
  children: ReferralNode[];
}

interface ReferralStructureViewProps {
  data: ReferralNode;
}

export default function ReferralStructureView({ data }: ReferralStructureViewProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-auto max-h-[600px] border rounded-md p-4">
        <ReferralTreeNode node={data} level={0} />
      </div>
    </div>
  );
}

interface ReferralTreeNodeProps {
  node: ReferralNode;
  level: number;
}

function ReferralTreeNode({ node, level }: ReferralTreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2);
  
  const getRoleLabel = (userRole: number) => {
    switch (userRole) {
      case 50: return "본부마스터";
      case 40: return "운영자";
      case 30: return "에이전시마스터";
      case 20: return "에이전시멤버";
      default: return "일반회원";
    }
  };
  
  return (
    <div className="ml-4">
      <div className="flex items-center space-x-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          disabled={node.children.length === 0}
        >
          {node.children.length > 0 ? (expanded ? "▼" : "►") : "○"}
        </Button>
        <div className="font-medium">
          {node.username} ({getRoleLabel(node.userRole)})
        </div>
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
      
      {expanded && node.children.length > 0 && (
        <div className="border-l pl-4">
          {node.children.map((child, index) => (
            <ReferralTreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}