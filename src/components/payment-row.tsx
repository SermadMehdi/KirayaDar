import { TableCell, TableRow } from "@/components/ui/table"
import { formatPKR, formatDate } from "@/lib/format"

interface PaymentRowProps {
  expectedDate: Date | string
  paidDate?: Date | string | null
  amount: number
  method: string
  referenceNumber: string | null
  status: string
  notes?: string | null
}

const METHOD_LABELS: Record<string, string> = {
  jazzcash:      "JazzCash",
  easypaisa:     "Easypaisa",
  bank_transfer: "Bank Transfer",
  raast:         "Raast",
  platform:      "Kirayadar",
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200" },
  confirmed: { label: "Confirmed", className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200" },
  disputed:  { label: "Disputed",  className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200" },
}

export function PaymentRow({
  expectedDate,
  paidDate,
  amount,
  method,
  referenceNumber,
  status,
  notes,
}: PaymentRowProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  return (
    <TableRow className="hover:bg-slate-50/50">
      <TableCell className="text-sm text-slate-600">{formatDate(expectedDate)}</TableCell>
      <TableCell className="text-sm font-semibold text-slate-800">{formatPKR(amount)}</TableCell>
      <TableCell className="text-sm text-slate-500">{paidDate ? formatDate(paidDate) : <span className="text-slate-300">—</span>}</TableCell>
      <TableCell className="text-sm text-slate-600">{METHOD_LABELS[method] ?? method}</TableCell>
      <TableCell className="text-xs">
        {referenceNumber ? (
          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{referenceNumber}</span>
        ) : (
          <span className="text-slate-300 italic">No ref</span>
        )}
        {notes && <p className="text-slate-400 mt-0.5 not-italic">{notes}</p>}
      </TableCell>
      <TableCell>
        <span className={config.className}>{config.label}</span>
      </TableCell>
    </TableRow>
  )
}
