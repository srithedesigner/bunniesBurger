'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, Printer } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DishProps } from "./dish"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type OrderSummaryProps = {
  tableName: string;
  dishes: DishProps[];
  dishQuantity: Record<number, number>;
  onIncrease: (dishId: number) => void;
  onDecrease: (dishId: number) => void;
  onPrint: () => void;
};

export function OrderSummary({
  tableName,
  dishes,
  dishQuantity,
  onIncrease,
  onDecrease,
  onPrint
}: OrderSummaryProps) {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | null>(null)
  const [isUPICompleted, setIsUPICompleted] = useState(false)
  const [cashAmount, setCashAmount] = useState('')
  const [change, setChange] = useState(0)
  const [showChangeModal, setShowChangeModal] = useState(false)

  const subtotal = dishes.reduce((total, dish) => total + dish.price * dishQuantity[dish.key], 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const handleTransactionComplete = () => {
    setIsTransactionModalOpen(false)
    setPaymentMethod(null)
    setIsUPICompleted(false)
    setCashAmount('')
  }

  const handleCashPayment = () => {
    const cashReceived = parseFloat(cashAmount)
    if (cashReceived >= total) {
      const changeAmount = cashReceived - total
      setChange(changeAmount)
      setShowChangeModal(true)
    } else {
      alert('Insufficient cash amount')
    }
  }

  const handleUPIFailure = () => {
    setIsUPICompleted(false)
    setPaymentMethod(null)
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Order Details</h2>
      <ScrollArea className="h-[calc(100vh-500px)] pr-4">
        <div className="grid grid-cols-[2fr,1fr,1fr] gap-4 mb-4 font-semibold">
          <div>Item</div>
          <div className="text-right">Price</div>
          <div className="text-center">Qty</div>
        </div>
        {dishes.map((dish) => (
          <div key={dish.key} className="grid grid-cols-[2fr,1fr,1fr] gap-4 items-center mb-4 pb-2 border-b">
            <span className="font-medium">{dish.name}</span>
            <span className="text-right">₹{dish.price.toFixed(2)}</span>
            <div className="flex items-center justify-center">
              <Button variant="outline" size="icon" onClick={() => onDecrease(dish.key)}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="mx-2 font-semibold w-6 text-center">{dishQuantity[dish.key]}</span>
              <Button variant="outline" size="icon" onClick={() => onIncrease(dish.key)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="mt-6 space-y-2">
        <p className="text-lg font-semibold flex justify-between"><span>Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></p>
        <p className="text-md flex justify-between"><span>GST (10%):</span> <span>₹{gst.toFixed(2)}</span></p>
        <p className="text-xl font-bold flex justify-between"><span>Total:</span> <span>₹{total.toFixed(2)}</span></p>
      </div>
      <div className="flex gap-4 mt-6">
        <Button className="flex-1" onClick={onPrint}><Printer className="mr-2 h-4 w-4" /> Print Bill</Button>
        <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1">Complete Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Transaction</DialogTitle>
            </DialogHeader>
            {!paymentMethod ? (
              <div className="flex gap-4">
                <Button onClick={() => setPaymentMethod('UPI')} className="flex-1">UPI</Button>
                <Button onClick={() => setPaymentMethod('Cash')} className="flex-1">Cash</Button>
              </div>
            ) : paymentMethod === 'UPI' ? (
              <div className="space-y-4">
                <p>Please complete the UPI transaction.</p>
                <div className="flex gap-4">
                  <Button onClick={() => setIsUPICompleted(true)} className="flex-1">Transaction Completed</Button>
                  <Button onClick={handleUPIFailure} className="flex-1">Transaction Failed</Button>
                </div>
                {isUPICompleted && (
                  <Button onClick={handleTransactionComplete} className="w-full">Confirm and Close</Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  type="number"
                  placeholder="Enter cash amount"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
                <Button onClick={handleCashPayment} className="w-full">Complete Cash Payment</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={showChangeModal} onOpenChange={setShowChangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Complete</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTitle>Change to be returned</AlertTitle>
            <AlertDescription>₹{change.toFixed(2)}</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={() => {
              setShowChangeModal(false)
              handleTransactionComplete()
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}