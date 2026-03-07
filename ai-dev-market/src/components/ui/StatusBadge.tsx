/**
 * StatusBadge — ステータス表示バッジコンポーネント
 */
import { RequestStatus, STATUS_LABEL, STATUS_COLOR } from "@/types";

interface Props {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: Props) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLOR[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
