import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export interface TableProps {
  key: number
  name: string
  total: number
  onClick?: () => void
}

export function Table({ name, total, onClick }: TableProps) {
  return (
    <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={onClick}>
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm font-medium">Total: ₹{total.toFixed(2)}</p>
      </CardContent>
    </Card>
  )
}