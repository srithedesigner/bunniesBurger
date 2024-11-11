import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface DishProps {
    key: number
    name: string
    price: number
    onClick?: () => void
    category: string
}

export function Dish({ name, price, onClick }: DishProps) {
    return (
        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={onClick}>
            <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">{name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm font-semibold">₹{price.toFixed(2)}</p>
            </CardContent>
        </Card>
    )
}