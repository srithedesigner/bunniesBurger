'use client'

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, List, SearchIcon } from 'lucide-react'
import { format, isToday, parseISO, startOfDay, endOfDay } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"

const orderList = [
    { key: 1, price: 250, date: "2024-03-14", time: "14:30", dishes: ["Burger", "Fries", "Coke"] },
    { key: 2, price: 180, date: "2024-03-14", time: "15:45", dishes: ["Pizza", "Salad"] },
    { key: 3, price: 320, date: new Date().toISOString().split('T')[0], time: "12:15", dishes: ["Steak", "Mashed Potatoes", "Wine"] }, // Today's date
    { key: 4, price: 150, date: new Date().toISOString().split('T')[0], time: "18:30", dishes: ["Sushi", "Miso Soup"] }, // Today's date
]

export interface OrderProps {
    key: number;
    price: number;
    date: string;
    time: string;
    dishes: string[];
}

export default function Orders() {
    const [showOrdersList, setShowOrdersList] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<OrderProps>()
    const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date())
    const [searchTerm, setSearchTerm] = useState('')

    const formattedDateFilter = dateFilter ? dateFilter.toISOString().split('T')[0] : '';

    const filteredOrders = useMemo(() => {
        return orderList.filter(order => {
            // Extract the date part from order.date (ensure it's in 'YYYY-MM-DD' format)
            const orderDate = order.date.split('T')[0];  // Date format 'YYYY-MM-DD'

            // Match order date exactly with the selected date filter
            const matchesDate = !formattedDateFilter || orderDate === formattedDateFilter;  // Exact date match

            // Search term match (same as before)
            const matchesSearch = !searchTerm ||
                ("OrderProps-" + order.key).toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.dishes.some(dish => dish.toLowerCase().includes(searchTerm.toLowerCase()))

            return matchesDate && matchesSearch;
        })
    }, [formattedDateFilter, searchTerm]);

    const todaysDate = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format

    const todaysOrders = useMemo(() => {
        return orderList.filter(order => order.date === todaysDate); // Exact date match
    }, [todaysDate]);


    console.log("Today's Orders:", todaysOrders);

    console.log(todaysOrders)

    const todaysTotalOrders = todaysOrders.length
    const todaysTotalRevenue = todaysOrders.reduce((sum, order) => sum + order.price, 0)

    return (
        <div className="p-1 pb-6 space-y-6 w-full">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{todaysTotalOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">₹{todaysTotalRevenue.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setShowOrdersList(true)}>View All Orders</Button>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showOrdersList} onOpenChange={setShowOrdersList}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>All Orders</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label htmlFor="date-filter">Filter by Date</Label>
                                <Calendar
                                    mode='single'
                                    selected={dateFilter}
                                    onSelect={setDateFilter}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Input
                                        id="search"
                                        type="text"
                                        placeholder="Search orders..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>OrderProps Number</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => (
                                        <TableRow key={order.key}>
                                            <TableCell>{"OrderProps-" + order.key}</TableCell>
                                            <TableCell>₹{order.price.toFixed(2)}</TableCell>
                                            <TableCell>{format(parseISO(order.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{order.time}</TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <div className="flex justify-between items-center pt-4 border-t">
                            <p className="font-semibold">Filtered Orders: {filteredOrders.length}</p>
                            <p className="font-semibold">
                                Filtered Total: ₹{filteredOrders.reduce((sum, order) => sum + order.price, 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(undefined)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>OrderProps Details</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <p><strong>OrderProps Number:</strong> {selectedOrder.key}</p>
                            <p><strong>Date:</strong> {format(parseISO(selectedOrder.date), 'dd/MM/yyyy')}</p>
                            <p><strong>Time:</strong> {selectedOrder.time}</p>
                            <p><strong>Total Price:</strong> ₹{selectedOrder.price.toFixed(2)}</p>
                            <div>
                                <strong>Dishes:</strong>
                                <ul className="list-disc list-inside">
                                    {selectedOrder.dishes.map((dish, index) => (
                                        <li key={index}>{dish}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}