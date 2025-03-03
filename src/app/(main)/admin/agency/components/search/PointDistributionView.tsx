// src/app/(main)/admin/agency/components/search/PointDistributionView.tsx

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PointDistribution {
  userId: string;
  calculatedAmount: number;
  grantedAmount: number;
  remainderAmount: number;
  distributionDetails: {
    masterId: string;
    masterType: string;
    commissionRate: number;
    amount: number;
  }[];
  timestamp: string;
}

interface PointDistributionViewProps {
  data: PointDistribution[];
}

export default function PointDistributionView({ data }: PointDistributionViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getMasterTypeLabel = (masterType: string) => {
    switch (masterType) {
      case 'HEADQUARTERS': return '본부구조';
      case 'NETWORK': return '네트워크';
      case 'BINARY_NETWORK': return '네트워크 바이너리';
      default: return masterType;
    }
  };
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>날짜</TableHead>
            <TableHead>계산 금액</TableHead>
            <TableHead>지급 금액</TableHead>
            <TableHead>이월 금액</TableHead>
            <TableHead>상세 정보</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{formatDate(item.timestamp)}</TableCell>
              <TableCell>{item.calculatedAmount.toFixed(2)}</TableCell>
              <TableCell>{item.grantedAmount}</TableCell>
              <TableCell>{item.remainderAmount.toFixed(2)}</TableCell>
              <TableCell>
                <details className="cursor-pointer">
                  <summary>상세 보기</summary>
                  <div className="mt-2 space-y-2 text-sm">
                    {item.distributionDetails.map((detail, detailIndex) => (
                      <div key={detailIndex} className="border-t pt-2">
                        <div>마스터 ID: {detail.masterId}</div>
                        <div>타입: {getMasterTypeLabel(detail.masterType)}</div>
                        <div>수수료 비율: {detail.commissionRate}%</div>
                        <div>금액: {detail.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}