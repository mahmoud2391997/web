"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ClockIcon, PlayIcon, StopCircleIcon, DollarSignIcon, EditIcon } from "lucide-react"
import { fetchOrders, editOrder, addOrder } from "@/store/slices/ordersSlice"
import { fetchRooms, editRoom } from "@/store/slices/roomsSlice"
import { fetchCafeProducts } from "@/store/slices/cafeProductsSlice"
import type { RootState, AppDispatch } from "@/store/store"
import { createOrderItem, createTransaction, updateOrderItem } from "@/services/dbService"
import { useToast } from "@/hooks/use-toast"
import { CafePaymentSelector } from "./CafePaymentSelector"
import CafeCartProcessor from "@/components/CafeCartProcessor"
import PaidOrderEditor from "./PaidOrderEditor"

const CurrentOrders = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { orders, loading } = useSelector((state: RootState) => state.orders)
  const { rooms } = useSelector((state: RootState) => state.rooms)
  const { products } = useSelector((state: RootState) => state.cafeProducts)
  const { toast } = useToast()

  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [newOrderDialog, setNewOrderDialog] = useState(false)
  const [extendTimeDialog, setExtendTimeDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [cafePaymentDialog, setCafePaymentDialog] = useState(false)
  const [reactivateDialog, setReactivateDialog] = useState(false)
  const [editPaidOrderDialog, setEditPaidOrderDialog] = useState(false)
  const [roomOrderForm, setRoomOrderForm] = useState({
    customer_name: "",
    room_id: "",
    mode: "single" as "single" | "multiplayer",
    is_open_time: false,
    duration_hours: 1,
  })
  const [timeExtension, setTimeExtension] = useState({
    orderId: "",
    roomId: "",
    hours: 1,
  })
  const [reactivateForm, setReactivateForm] = useState({
    duration_hours: 1,
    is_open_time: false,
  })

  // 在 CurrentOrders.tsx 中修改 useEffect
  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        const { initializeSampleData } = await import("@/utils/initializeData")
        await initializeSampleData()
      } catch (error) {
        console.error("Failed to initialize data:", error)
      }

      // 确保数据完全加载后再进行过滤
      await dispatch(fetchOrders({} as any))
      await dispatch(fetchRooms())
      await dispatch(fetchCafeProducts())
    }

    initializeAndFetch()
  }, [dispatch])

  // 调整清理触发时机
  useEffect(() => {
    const performDataCleanup = async () => {
      if (!orders.length || !rooms.length) return

      try {
        const { cleanupOrphanOrders, fixLegacyOrders } = await import("@/utils/dataCleanup")

        const [orphanResults, legacyResults] = await Promise.all([cleanupOrphanOrders(), fixLegacyOrders()])

        const totalFixed = orphanResults.fixedCount + legacyResults.fixedCount

        if (totalFixed > 0) {
          // 延迟刷新，避免立即清除显示中的订单
          setTimeout(async () => {
            await dispatch(fetchOrders({} as any))
          }, 3000)

          toast({
            title: "System Maintenance",
            description: `Fixed ${orphanResults.fixedCount} orphaned orders and ${legacyResults.fixedCount} legacy orders.`,
            duration: 5000,
          })
        }
      } catch (error) {
        console.error("Error during data cleanup:", error)
      }
    }

    // 增加延迟时间，确保UI完全加载
    const timer = setTimeout(() => {
      performDataCleanup()
    }, 5000)

    return () => clearTimeout(timer)
  }, [dispatch, orders, rooms, toast])

  // Auto-refresh orders every 30 seconds to sync with room statuses
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchOrders({} as any))
      dispatch(fetchRooms())
    }, 30000)

    return () => clearInterval(interval)
  }, [dispatch])

  // Force refresh when component mounts to ensure fresh data
  useEffect(() => {
    const forceRefresh = async () => {
      await dispatch(fetchOrders({} as any))
      await dispatch(fetchRooms())
      await dispatch(fetchCafeProducts())
    }

    forceRefresh()
  }, [dispatch])

  // Show active, paused, completed (until paid), and active cafe orders
  // 修改订单过滤条件，确保包含所有需要显示的状态
  const currentOrders =
    orders?.filter(
      (order: any) =>
        order.status === "active" ||
        order.status === "paused" ||
        order.status === "completed" ||
        order.status === "paid", // 添加已支付订单的显示
    ) || []

  // Sort orders by priority: active first, then paused, then completed
  currentOrders.sort((a: any, b: any) => {
    const statusPriority = { active: 1, paused: 2, completed: 3 }
    return (
      (statusPriority[a.status as keyof typeof statusPriority] || 4) -
      (statusPriority[b.status as keyof typeof statusPriority] || 4)
    )
  })

  const createRoomOrder = async () => {
    if (!roomOrderForm.customer_name || !roomOrderForm.room_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      const room = rooms.find((r) => r.id === roomOrderForm.room_id)
      if (!room) return

      const newOrder = {
        customer_name: roomOrderForm.customer_name,
        room_id: roomOrderForm.room_id,
        mode: roomOrderForm.mode,
        is_open_time: roomOrderForm.is_open_time,
        duration_hours: roomOrderForm.duration_hours,
        order_type: "room_reservation" as const,
        status: "paused" as const,
        total_amount: 0,
        start_time: null,
      }

      await dispatch(addOrder(newOrder))
      setNewOrderDialog(false)
      setRoomOrderForm({
        customer_name: "",
        room_id: "",
        mode: "single",
        is_open_time: false,
        duration_hours: 1,
      })

      toast({
        title: "Order Created",
        description: `Room order created for ${roomOrderForm.customer_name}`,
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room order",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const adjustOrderTime = async (orderId: string, roomId: string, adjustment: number) => {
    try {
      const room = rooms?.find((r) => r.id === roomId)
      const order = orders?.find((o) => o.id === orderId)

      if (!room || !order) {
        toast({
          title: "Error",
          description: "Cannot adjust time for this session",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      const hourlyRate = room.current_mode === "single" ? room.pricing_single : room.pricing_multiplayer
      const additionalCost = adjustment * hourlyRate
      const newTotalAmount = order.total_amount + additionalCost

      // Update Redux state immediately
      const { updateOrderInState, updateOrderItemInState } = await import("@/store/slices/ordersSlice")
      dispatch(updateOrderInState({ id: orderId, updates: { total_amount: newTotalAmount } }))

      // Update room end time if session is active
      if (room.current_session_end) {
        const currentEndTime = new Date(room.current_session_end)
        const newEndTime = new Date(currentEndTime.getTime() + adjustment * 60 * 60 * 1000)

        await dispatch(
          editRoom({
            id: roomId,
            updates: { current_session_end: newEndTime.toISOString() },
          }),
        )
      }

      // Get fresh order items to preserve cafe items
      const { getOrderItems } = await import("@/services/dbService")
      const currentItems = await getOrderItems(orderId)

      // Update or create order items for time adjustment while preserving cafe items
      const roomTimeItem = currentItems.find((item: any) => item.item_type === "room_time")
      if (roomTimeItem) {
        const newQuantity = Math.max(0, roomTimeItem.quantity + adjustment)
        const newTotalPrice = roomTimeItem.total_price + additionalCost

        // Update Redux state immediately for room time item only
        dispatch(
          updateOrderItemInState({
            orderId,
            itemId: roomTimeItem.id,
            updates: {
              quantity: newQuantity,
              total_price: newTotalPrice,
            },
          }),
        )

        // Update database
        const { updateOrderItem } = await import("@/services/dbService")
        await updateOrderItem(roomTimeItem.id, {
          quantity: newQuantity,
          total_price: newTotalPrice,
          is_paid: order.status === "paid", // Maintain payment status
        })
      } else {
        // Create new room time item if none exists
        const { createOrderItem } = await import("@/services/dbService")
        await createOrderItem({
          order_id: orderId,
          item_type: "room_time",
          item_name: `${room.name} - Time Adjustment (${adjustment > 0 ? "+" : ""}${adjustment}h)`,
          quantity: Math.abs(adjustment),
          unit_price: hourlyRate,
          total_price: Math.abs(additionalCost),
          is_paid: order.status === "paid",
        })
      }

      // Refresh all order items to ensure cafe items are preserved
      const updatedItems = await getOrderItems(orderId)
      const { updateOrderItems } = await import("@/store/slices/ordersSlice")
      dispatch(updateOrderItems({ orderId, newItems: updatedItems }))

      // Update order in database
      await dispatch(
        editOrder({
          id: orderId,
          updates: { total_amount: newTotalAmount },
        }),
      )

      // If order is paid, update the transaction amount as well
      if (order.status === "paid") {
        try {
          const { getTransactions, updateTransaction } = await import("@/services/dbService")
          const transactions = await getTransactions()
          const validTransactions = Array.isArray(transactions) ? transactions : []
          const orderTransaction = validTransactions.find(
            (tx: any) => tx && tx.order_id === orderId && tx.transaction_type === "payment",
          )

          if (orderTransaction) {
            await updateTransaction(orderTransaction.id, {
              amount: newTotalAmount,
              description: `Updated payment for order ${orderId} - Time adjustment: ${adjustment > 0 ? "+" : ""}${adjustment}h - Total: ${newTotalAmount.toFixed(2)} EGP`,
            })
          }
        } catch (transactionError) {
          console.warn("Could not update transaction for time adjustment:", transactionError)
        }
      }

      // Force refresh orders to show updated items with preserved cafe items
      dispatch(fetchOrders({} as any))
      setTimeout(() => dispatch(fetchOrders({} as any)), 200)
      setTimeout(() => dispatch(fetchOrders({} as any)), 500)

      toast({
        title: adjustment > 0 ? "Time Added" : "Time Reduced",
        description: `${Math.abs(adjustment * 60)} minutes ${adjustment > 0 ? "added" : "removed"}. New total: ${newTotalAmount.toFixed(2)} EGP`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error adjusting order time:", error)
      toast({
        title: "Error",
        description: "Failed to adjust session time",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const startRoomSession = async (order: any) => {
    try {
      const room = rooms.find((r) => r.id === order.room_id)
      if (!room) return

      const startTime = new Date().toISOString()
      const formattedStartTime = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })
      let endTime = null

      // Only set end time if it's not open time
      if (!order.is_open_time && order.duration_hours) {
        const end = new Date()
        end.setHours(end.getHours() + order.duration_hours)
        endTime = end.toISOString()
      }

      // Update room status
      await dispatch(
        editRoom({
          id: order.room_id,
          updates: {
            status: "occupied",
            current_customer_name: order.customer_name,
            current_session_start: startTime,
            current_session_end: endTime,
            current_mode: order.mode || roomOrderForm.mode,
            current_total_cost: order.total_amount,
          },
        }),
      )

      // Update order
      await dispatch(
        editOrder({
          id: order.id,
          updates: {
            start_time: formattedStartTime,
            end_time: endTime,
            status: "active",
          },
        }),
      )

      toast({
        title: "Session Started",
        description: `Room ${room.name} session started for ${order.customer_name}`,
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start room session",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const stopRoomSession = async (order: any) => {
    try {
      const room = rooms.find((r) => r.id === order.room_id)
      if (!room) return

      const endTime = new Date()
      const formattedEndTime = endTime.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })

      const startTime = new Date(room.current_session_start || new Date())
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

      const pricing = (order.mode || roomOrderForm.mode) === "single" ? room.pricing_single : room.pricing_multiplayer

      // Calculate total cost including all order items (room time + cafe items)
      let totalCost = 0

      if (order.order_items && order.order_items.length > 0) {
        // Calculate from existing order items
        totalCost = order.order_items.reduce((sum: number, item: any) => {
          if (item.item_type === "room_time") {
            // For both open time and fixed time, calculate based on actual duration passed
            const roomCost = durationHours * pricing
            return sum + roomCost
          } else {
            // For cafe items, use the existing total_price
            return sum + (item.total_price || 0)
          }
        }, 0)
      } else {
        // Fallback: calculate room cost based on actual time passed
        const roomCost = durationHours * pricing
        totalCost = roomCost
      }

      // Update room status
      await dispatch(
        editRoom({
          id: order.room_id,
          updates: {
            status: "available",
            current_customer_name: null,
            current_session_start: null,
            current_session_end: null,
            current_mode: null,
            current_total_cost: 0,
          },
        }),
      )

      // Update order status to completed (not paid yet)
      await dispatch(
        editOrder({
          id: order.id,
          updates: {
            end_time: new Date().toISOString(),
            total_amount: totalCost,
            status: "completed",
          },
        }),
      )

      // Update room time order item for all sessions to reflect actual time passed
      if (order.order_items) {
        const roomTimeItem = order.order_items.find((item: any) => item.item_type === "room_time")
        if (roomTimeItem) {
          await updateOrderItem(roomTimeItem.id, {
            quantity: durationHours,
            total_price: Number.parseFloat((durationHours * pricing).toFixed(2)),
            is_paid: false,
          })
        }
        // Refresh items and update Redux immediately for correct unpaid totals
        try {
          const { getOrderItems } = await import("@/services/dbService")
          const { updateOrderItems, updateOrderInState } = await import("@/store/slices/ordersSlice")
          const freshItems = await getOrderItems(order.id)
          dispatch((updateOrderItems as any)({ orderId: order.id, newItems: freshItems }))
          dispatch((updateOrderInState as any)({ id: order.id, updates: { total_amount: totalCost } }))
        } catch {}
      }

      // Create transaction only if completing the order
      // Don't create transaction automatically - payment happens when user clicks Pay button

      // Use state manager for consistent updates
      const { StateManager } = await import("@/utils/stateManager")
      await StateManager.refreshOrders(true)

      console.log(
        `Session stopped. Duration: ${durationHours.toFixed(2)} hours, Total Cost: ${totalCost.toFixed(2)} EGP`,
      )

      toast({
        title: "Session Stopped",
        description: `Session stopped. Duration: ${durationHours.toFixed(2)} hours, Total: ${totalCost.toFixed(2)} EGP. Ready for payment.`,
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop room session",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const reactivateOrder = async () => {
    if (!selectedOrder) return

    try {
      const room = rooms.find((r) => r.id === selectedOrder.room_id)
      if (!room || room.status !== "available") {
        toast({
          title: "Error",
          description: "Room is not available for reactivation",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      const startTime = new Date().toISOString()
      const formattedStartTime = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })
      let endTime = null

      if (!reactivateForm.is_open_time) {
        const end = new Date()
        end.setHours(end.getHours() + reactivateForm.duration_hours)
        endTime = end.toISOString()
      }

      // Update room status
      await dispatch(
        editRoom({
          id: selectedOrder.room_id,
          updates: {
            status: "occupied",
            current_customer_name: selectedOrder.customer_name,
            current_session_start: startTime,
            current_session_end: endTime,
            current_mode: selectedOrder.mode || roomOrderForm.mode,
            current_total_cost: selectedOrder.total_amount,
          },
        }),
      )

      // Calculate pricing for the new session
      const pricing = selectedOrder.mode === "single" ? room.pricing_single : room.pricing_multiplayer
      const newSessionCost = reactivateForm.is_open_time ? 0 : reactivateForm.duration_hours * pricing

      // Update order
      await dispatch(
        editOrder({
          id: selectedOrder.id,
          updates: {
            start_time: formattedStartTime,
            end_time: endTime,
            status: "active",
            total_amount: selectedOrder.total_amount + newSessionCost,
          },
        }),
      )

      // Create order item for the new session
      await createOrderItem({
        order_id: selectedOrder.id,
        item_type: "room_time",
        item_name: `${room.name} - ${selectedOrder.mode || "single"} mode (${reactivateForm.is_open_time ? "Open Time" : `${reactivateForm.duration_hours}h`})`,
        quantity: reactivateForm.is_open_time ? 0 : reactivateForm.duration_hours,
        unit_price: pricing,
        total_price: newSessionCost,
        is_paid: false, // New time sessions are unpaid
      })

      // Multiple refreshes to ensure the new order item appears
      dispatch(fetchOrders({} as any))
      setTimeout(() => dispatch(fetchOrders({} as any)), 100)
      setTimeout(() => dispatch(fetchOrders({} as any)), 300)

      setReactivateDialog(false)
      setSelectedOrder(null)
      setReactivateForm({ duration_hours: 1, is_open_time: false })

      toast({
        title: "Order Reactivated",
        description: `Room session resumed for ${selectedOrder.customer_name}. New session: ${reactivateForm.is_open_time ? "Open Time" : `${reactivateForm.duration_hours}h`}`,
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate order",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const extendTime = async () => {
    try {
      const room = rooms.find((r) => r.id === timeExtension.roomId)
      const order = orders.find((o) => o.id === timeExtension.orderId)

      if (!room || !order) return

      const hourlyRate = room.current_mode === "single" ? room.pricing_single : room.pricing_multiplayer
      const additionalCost = timeExtension.hours * hourlyRate
      const newTotalAmount = order.total_amount + additionalCost

      let newEndTime = null
      if (room.current_session_end) {
        const currentEndTime = new Date(room.current_session_end)
        newEndTime = new Date(currentEndTime.getTime() + timeExtension.hours * 60 * 60 * 1000)
      } else if (order.end_time) {
        const currentEndTime = new Date(order.end_time)
        newEndTime = new Date(currentEndTime.getTime() + timeExtension.hours * 60 * 60 * 1000)
      }

      // Update room if session is active
      if (room.status === "occupied" && newEndTime) {
        await dispatch(
          editRoom({
            id: timeExtension.roomId,
            updates: {
              current_session_end: newEndTime.toISOString(),
            },
          }),
        )
      }

      // Update order and optimistically refresh current order items/amount
      await dispatch(
        editOrder({
          id: timeExtension.orderId,
          updates: {
            end_time: newEndTime?.toISOString() || order.end_time,
            total_amount: newTotalAmount,
          },
        }),
      )

      // If order has a room_time item, update it in DB and refresh items in Redux
      try {
        const { getOrderItems, updateOrderItem } = await import("@/services/dbService")
        const { updateOrderItems, updateOrderInState } = await import("@/store/slices/ordersSlice")
        const currentItems = await getOrderItems(order.id)
        const roomTime = currentItems.find((i: any) => i.item_type === "room_time")
        if (roomTime && newEndTime) {
          const startTs = room.current_session_start
            ? new Date(room.current_session_start).getTime()
            : order.start_time
              ? new Date(order.start_time).getTime()
              : Date.now()
          const durHours = Math.max(0, (new Date(newEndTime).getTime() - startTs) / (1000 * 60 * 60))
          const newTotal = Number.parseFloat((durHours * hourlyRate).toFixed(2))
          await updateOrderItem(roomTime.id, {
            quantity: durHours,
            total_price: newTotal,
          })

          // Update Redux state immediately
          const updatedItems = await getOrderItems(order.id)
          dispatch(updateOrderItems({ orderId: order.id, newItems: updatedItems }))

          // Also update the order total in Redux
          dispatch(
            updateOrderInState({
              id: order.id,
              updates: { total_amount: newTotalAmount },
            }),
          )
        }
      } catch (itemError) {
        console.error("Error updating order items:", itemError)
      }

      // Force multiple refreshes to ensure UI updates
      dispatch(fetchOrders({} as any))
      setTimeout(() => dispatch(fetchOrders({} as any)), 200)
      setTimeout(() => dispatch(fetchOrders({} as any)), 500)

      setTimeExtension({ roomId: "", orderId: "", hours: 0.5 })

      toast({
        title: "Time Extended",
        description: `Added ${timeExtension.hours} hours for ${additionalCost.toFixed(2)} EGP`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Error extending time:", error)
      toast({
        title: "Error",
        description: "Failed to extend time",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const completeCafePayment = async (selectedCafeItems: string[]) => {
    if (!selectedOrder) return

    try {
      // Calculate only selected unpaid cafe items
      let unpaidTotal = 0
      const unpaidItems: any[] = []

      if (selectedOrder.order_items && selectedOrder.order_items.length > 0) {
        selectedOrder.order_items.forEach((item: any) => {
          if (!item.is_paid && item.item_type === "cafe_product" && selectedCafeItems.includes(item.id)) {
            unpaidTotal += item.total_price || 0
            unpaidItems.push(item)
          }
        })
      }

      if (unpaidTotal === 0) {
        toast({
          title: "No Payment Needed",
          description: "No unpaid cafe items selected",
          duration: 3000,
        })
        setCafePaymentDialog(false)
        return
      }

      // Mark selected items as paid (optimistic + persist)
      for (const item of unpaidItems) {
        try {
          const { updateOrderItemInState } = await import("@/store/slices/ordersSlice")
          // Optimistic update in Redux state
          dispatch(
            (updateOrderItemInState as any)({ orderId: selectedOrder.id, itemId: item.id, updates: { is_paid: true } }),
          )
        } catch {}
        await updateOrderItem(item.id, { is_paid: true })
      }

      // Create transaction for selected cafe items
      const itemsDescription = unpaidItems.map((item) => `${item.item_name} (${item.quantity}x)`).join(", ")
      await createTransaction({
        order_id: selectedOrder.id,
        transaction_type: "payment",
        amount: unpaidTotal,
        payment_method: "cash",
        description: `Cafe items payment for order ${selectedOrder.id} - Items: ${itemsDescription}`,
      })

      // Refresh items from DB to ensure accurate pay status in UI
      try {
        const { getOrderItems } = await import("@/services/dbService")
        const { updateOrderItems } = await import("@/store/slices/ordersSlice")
        const fresh = await getOrderItems(selectedOrder.id)
        dispatch((updateOrderItems as any)({ orderId: selectedOrder.id, newItems: fresh }))
      } catch {}

      // Check if all items in the order are now paid using freshest copy
      const itemsNow = (selectedOrder.order_items || []).map((i: any) => ({ ...i }))
      unpaidItems.forEach((ui) => {
        const idx = itemsNow.findIndex((i: any) => i.id === ui.id)
        if (idx !== -1) itemsNow[idx].is_paid = true
      })
      const allItemsPaid = itemsNow.every((item: any) => item.is_paid)

      // If all items are paid and order is completed, mark as paid
      if (allItemsPaid && selectedOrder.status === "completed") {
        await dispatch(
          editOrder({
            id: selectedOrder.id,
            updates: {
              status: "paid",
            },
          }),
        )
      }

      // Force multiple refreshes to ensure UI updates
      dispatch(fetchOrders({} as any))
      setTimeout(() => dispatch(fetchOrders({} as any)), 200)
      setTimeout(() => dispatch(fetchOrders({} as any)), 500)

      setCafePaymentDialog(false)
      setSelectedOrder(null)

      toast({
        title: "Payment Completed",
        description: `Paid ${unpaidTotal.toFixed(2)} EGP for ${unpaidItems.length} cafe items`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Error completing cafe payment:", error)
      toast({
        title: "Error",
        description: "Failed to complete cafe payment",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const completePayment = async (order: any) => {
    try {
      // Fetch fresh order items to avoid re-paying already paid items
      let unpaidTotal = 0
      const unpaidItems: any[] = []
      let isLegacyOrder = false

      try {
        const { getOrderItems } = await import("@/services/dbService")
        const freshItems = await getOrderItems(order.id)

        if (freshItems.length === 0 && order.total_amount > 0 && order.status === "completed") {
          // Legacy order without items - create a generic item for the total amount
          isLegacyOrder = true
          unpaidTotal = order.total_amount

          const { createOrderItem } = await import("@/services/dbService")
          const legacyItem = await createOrderItem({
            order_id: order.id,
            item_type: "room_time",
            item_name: `${order.order_type === "room_reservation" ? "Room Reservation" : "Order"} - Time`,
            quantity: 1,
            unit_price: order.total_amount,
            total_price: order.total_amount,
            is_paid: false,
          })

          // Add to unpaid items for payment processing
          unpaidItems.push({
            ...legacyItem,
            id: legacyItem.id,
            item_name: legacyItem.item_name,
            total_price: legacyItem.total_price,
          })
        } else {
          // Process regular unpaid items
          freshItems.forEach((item: any) => {
            if (!item.is_paid) {
              unpaidTotal += item.total_price || 0
              unpaidItems.push(item)
            }
          })
        }
      } catch (error) {
        console.error("Error fetching order items:", error)
        toast({
          title: "Error",
          description: "Failed to fetch order details",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      if (unpaidTotal === 0) {
        toast({
          title: "No Payment Needed",
          description: "All items are already paid",
          duration: 3000,
        })
        setPaymentDialog(false)
        return
      }

      // Mark all unpaid items as paid
      for (const item of unpaidItems) {
        try {
          const { updateOrderItemInState } = await import("@/store/slices/ordersSlice")
          // Optimistic update in Redux state
          dispatch(
            (updateOrderItemInState as any)({
              orderId: order.id,
              itemId: item.id,
              updates: { is_paid: true },
            }),
          )
        } catch (error) {
          console.error("Error updating item state:", error)
        }
        await updateOrderItem(item.id, { is_paid: true })
      }

      // Create transaction for the payment
      const itemsDescription = unpaidItems.map((item) => `${item.item_name} (${item.quantity}x)`).join(", ")
      await createTransaction({
        order_id: order.id,
        transaction_type: "payment",
        amount: unpaidTotal,
        payment_method: "cash",
        description: `Payment for order ${order.id} - Items: ${itemsDescription}`,
      })

      // Update order status to paid
      await dispatch(
        editOrder({
          id: order.id,
          updates: {
            status: "paid",
          },
        }),
      )

      // Force multiple refreshes to ensure UI updates
      dispatch(fetchOrders({} as any))
      setTimeout(() => dispatch(fetchOrders({} as any)), 200)
      setTimeout(() => dispatch(fetchOrders({} as any)), 500)

      setPaymentDialog(false)
      setSelectedOrder(null)

      toast({
        title: "Payment Completed",
        description: `Paid ${unpaidTotal.toFixed(2)} EGP for ${unpaidItems.length} items`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Error completing payment:", error)
      toast({
        title: "Error",
        description: "Failed to complete payment",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const getOrderTypeColor = (orderType: string) => {
    switch (orderType) {
      case "room_reservation":
        return "bg-blue-600"
      case "cafe_order":
        return "bg-orange-600"
      case "combo":
        return "bg-purple-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Current Orders</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => setNewOrderDialog(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <ClockIcon className="w-4 h-4 mr-2" />
            New Room Order
          </Button>

          <CafeCartProcessor
            cafeProducts={products}
            onOrderProcessed={async () => {
              // Immediate refresh with multiple attempts
              await dispatch(fetchOrders({} as any))
              await dispatch(fetchRooms())
              setTimeout(async () => {
                await dispatch(fetchOrders({} as any))
                await dispatch(fetchRooms())
              }, 100)
              setTimeout(async () => {
                await dispatch(fetchOrders({} as any))
                await dispatch(fetchRooms())
              }, 500)
            }}
          />
        </div>
      </div>

      {currentOrders.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-lg">No current orders</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentOrders.map((order: any) => {
            const room = rooms.find((r) => r.id === order.room_id)
            const isRoomOrder = order.order_type === "room_reservation" || order.order_type === "combo"
            const isSessionActive =
              room && room.status === "occupied" && room.current_customer_name === order.customer_name
            const isPaused = order.status === "paused"
            const isCompleted = order.status === "completed"
            const items = order.order_items || []
            const paidSum = items
              .filter((i: any) => i.is_paid)
              .reduce((s: number, i: any) => s + (i.total_price || 0), 0)
            let unpaidTotal = items
              .filter((i: any) => !i.is_paid)
              .reduce((s: number, i: any) => s + (i.total_price || 0), 0)

            if (items.length === 0 && (order.status === "completed" || order.status === "paused")) {
              unpaidTotal = order.total_amount || 0
            } else if (unpaidTotal === 0 && (order.status === "completed" || order.status === "paused")) {
              // Fallback to total minus paid portion if item flags were missing
              unpaidTotal = Math.max((order.total_amount || 0) - paidSum, 0)
            }
            const getOrderTypeColor = (orderType: string) => {
              switch (orderType) {
                case "room_reservation":
                  return "bg-blue-600"
                case "cafe_order":
                  return "bg-orange-600"
                case "combo":
                  return "bg-purple-600"
                default:
                  return "bg-gray-600"
              }
            }

            const hasUnpaid = unpaidTotal > 0

            // Handle edge case where order has no items but has total amount (legacy orders)
            const legacyUnpaidAmount =
              items.length === 0 && order.total_amount > 0 && order.status === "completed" ? order.total_amount : 0

            return (
              <Card key={order.id} className={`bg-slate-800 border-slate-700 ${isPaused ? "border-yellow-500" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">{order.customer_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getOrderTypeColor(order.order_type || 'room_reservation')} text-white`}>
                          {(order.order_type || 'room_reservation').replace("_", " ").toUpperCase()}
                        </Badge>
                        {isRoomOrder && room && (
                          <Badge variant="outline" className="text-gray-300">
                            {room.name} - {room.console_type}
                          </Badge>
                        )}
                        {isPaused && <Badge className="bg-yellow-600 text-white">PAUSED</Badge>}
                        {order.is_open_time && <Badge className="bg-purple-600 text-white">OPEN TIME</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        {order.is_open_time && isSessionActive
                          ? "Pay on Stop"
                          : `${(hasUnpaid ? unpaidTotal : legacyUnpaidAmount || order.total_amount || 0)?.toFixed(2)} EGP`}
                      </div>
                      {order.start_time && (
                        <div className="text-sm text-gray-400">
                          {order.room_id
                            ? `Room ${rooms.find((r) => r.id === order.room_id)?.name || "Unknown"}`
                            : "Café Order"}{" "}
                          •{order.mode} •
                          {order.order_type === "combo"
                            ? "Combo Order"
                            : order.order_type === "room_reservation"
                              ? "Room Reservation"
                              : order.order_type === "cafe_order"
                                ? "Café Order"
                                : "Order"}{" "}
                          •
                          {order.status === "active"
                            ? "In Progress"
                            : order.status === "paused"
                              ? "Paused"
                              : order.status === "completed"
                                ? "Completed"
                                : order.status === "paid"
                                  ? "Paid"
                                  : "Unknown"}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Items:</div>
                    {order.order_items?.map((item: any, index: any) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className={`${item.is_paid ? "text-green-400" : "text-gray-300"}`}>
                          {item.quantity > 0 ? `${item.quantity}x ` : ""}
                          {item.item_name}
                          {item.is_paid && " ✓"}
                        </span>
                        <span className={`${item.is_paid ? "text-green-400" : "text-white"}`}>
                          {item.total_price?.toFixed(2) || "0.00"} EGP
                        </span>
                      </div>
                    ))}

                    {/* Show unpaid total */}
                    {order.order_items && order.order_items.some((item: any) => !item.is_paid) && (
                      <div className="border-t border-slate-600 pt-2 mt-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-yellow-400">Unpaid Total:</span>
                          <span className="text-yellow-400">
                            {order.order_items
                              .filter((item: any) => !item.is_paid)
                              .reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)
                              .toFixed(2)}{" "}
                            EGP
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {isRoomOrder && room && (
                      <>
                        {isPaused ? (
                          <Button
                            onClick={() => {
                              setSelectedOrder(order)
                              setReactivateDialog(true)
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            size="sm"
                            disabled={room.status !== "available"}
                          >
                            <PlayIcon className="w-4 h-4 mr-1" />
                            Reactivate
                          </Button>
                        ) : isSessionActive ? (
                          <Button
                            onClick={() => stopRoomSession(order)}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            <StopCircleIcon className="w-4 h-4 mr-1" />
                            Stop
                          </Button>
                        ) : null}
                      </>
                    )}

                    <CafeCartProcessor
                      cafeProducts={products}
                      existingOrderId={order.id}
                      onOrderProcessed={async () => {
                        // Multiple immediate state updates to ensure UI refresh
                        await dispatch(fetchOrders({} as any))
                        await dispatch(fetchRooms())
                        setTimeout(async () => {
                          await dispatch(fetchOrders({} as any))
                          await dispatch(fetchRooms())
                        }, 100)
                        setTimeout(async () => {
                          await dispatch(fetchOrders({} as any))
                          await dispatch(fetchRooms())
                        }, 500)
                      }}
                    />

                    {/* Show Pay Cafe Items button only if there are unpaid cafe items */}
                    {order.order_items &&
                      order.order_items.some((item: any) => item.item_type === "cafe_product" && !item.is_paid) && (
                        <Button
                          onClick={() => {
                            setSelectedOrder(order)
                            setCafePaymentDialog(true)
                          }}
                          className="bg-orange-600 hover:bg-orange-700"
                          size="sm"
                        >
                          <DollarSignIcon className="w-4 h-4 mr-1" />
                          Pay Cafe Items
                        </Button>
                      )}

                    {/* Show payment button when there is unpaid total (completed, paused or non-room) */}
                    {(hasUnpaid || legacyUnpaidAmount > 0) && (isCompleted || isPaused || !isRoomOrder) && (
                      <Button
                        onClick={() => {
                          setSelectedOrder(order)
                          setPaymentDialog(true)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <DollarSignIcon className="w-4 h-4 mr-1" />
                        Pay ({(hasUnpaid ? unpaidTotal : legacyUnpaidAmount).toFixed(2)} EGP)
                      </Button>
                    )}

                    {/* Show edit button for paid orders */}
                    {order.status === "paid" && (
                      <Button
                        onClick={() => {
                          setSelectedOrder(order)
                          setEditPaidOrderDialog(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <EditIcon className="w-4 h-4 mr-1" />
                        Edit Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reactivate Dialog */}
      <Dialog open={reactivateDialog} onOpenChange={setReactivateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Reactivate Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-gray-300">
              Customer: <span className="text-white font-medium">{selectedOrder?.customer_name}</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="openTime"
                checked={reactivateForm.is_open_time}
                onChange={(e) => setReactivateForm({ ...reactivateForm, is_open_time: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="openTime">Open Time (Pay when session ends)</Label>
            </div>

            {!reactivateForm.is_open_time && (
              <div>
                <Label>Duration (Hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={reactivateForm.duration_hours}
                  onChange={(e) =>
                    setReactivateForm({ ...reactivateForm, duration_hours: Number.parseFloat(e.target.value) })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={reactivateOrder} className="flex-1 bg-green-600 hover:bg-green-700">
                <PlayIcon className="w-4 h-4 mr-2" />
                Reactivate Session
              </Button>
              <Button onClick={() => setReactivateDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Room Order Dialog */}
      <Dialog open={newOrderDialog} onOpenChange={setNewOrderDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Create Room Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer Name</Label>
              <Input
                value={roomOrderForm.customer_name}
                onChange={(e) => setRoomOrderForm({ ...roomOrderForm, customer_name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <Label>Room</Label>
              <Select
                value={roomOrderForm.room_id}
                onValueChange={(value) => setRoomOrderForm({ ...roomOrderForm, room_id: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {rooms
                    .filter((room) => room.status === "available")
                    .map((room) => (
                      <SelectItem key={room.id} value={room.id} className="text-white">
                        {room.name} - {room.console_type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mode</Label>
              <Select
                value={roomOrderForm.mode}
                onValueChange={(value: "single" | "multiplayer") => setRoomOrderForm({ ...roomOrderForm, mode: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="single" className="text-white">
                    Single Player
                  </SelectItem>
                  <SelectItem value="multiplayer" className="text-white">
                    Multiplayer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="openTime"
                checked={roomOrderForm.is_open_time}
                onChange={(e) => setRoomOrderForm({ ...roomOrderForm, is_open_time: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="openTime">Open Time (Pay when session ends)</Label>
            </div>

            {!roomOrderForm.is_open_time && (
              <div>
                <Label>Duration (Hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={roomOrderForm.duration_hours}
                  onChange={(e) =>
                    setRoomOrderForm({ ...roomOrderForm, duration_hours: Number.parseFloat(e.target.value) })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            )}

            <Button onClick={createRoomOrder} className="w-full bg-blue-600 hover:bg-blue-700">
              Create Room Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Time Dialog */}
      <Dialog open={extendTimeDialog} onOpenChange={setExtendTimeDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Extend Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Additional Hours</Label>
              <Select
                value={timeExtension.hours.toString()}
                onValueChange={(value) => setTimeExtension({ ...timeExtension, hours: Number.parseFloat(value) })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="0.5" className="text-white">
                    30 minutes
                  </SelectItem>
                  <SelectItem value="1" className="text-white">
                    1 hour
                  </SelectItem>
                  <SelectItem value="1.5" className="text-white">
                    1.5 hours
                  </SelectItem>
                  <SelectItem value="2" className="text-white">
                    2 hours
                  </SelectItem>
                  <SelectItem value="3" className="text-white">
                    3 hours
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={extendTime} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Extend Time
              </Button>
              <Button onClick={() => setExtendTimeDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div>
                <p className="text-sm text-gray-300 mb-2">Order for: {selectedOrder.customer_name}</p>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-300">Items:</div>
                  {selectedOrder.order_items?.map((item: any, index: any) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-slate-700 p-2 rounded">
                      <div className="flex-1">
                        <span className="text-white">{item.item_name}</span>
                        <span className="text-gray-400 ml-2">x{item.quantity}</span>
                        {item.is_paid && (
                          <Badge variant="outline" className="ml-2 text-green-400 border-green-400">
                            Paid
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">{item.total_price?.toFixed(2)} EGP</span>
                        {/* Remove item button for unpaid items */}
                        {!item.is_paid && item.item_type === "cafe_product" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const { deleteOrderItem } = await import("@/services/dbService")
                                await deleteOrderItem(item.id)

                                // Update order total
                                const newTotal = selectedOrder.total_amount - item.total_price
                                await dispatch(
                                  editOrder({
                                    id: selectedOrder.id,
                                    updates: { total_amount: newTotal },
                                  }),
                                )

                                // Refresh orders
                                dispatch(fetchOrders({} as any))

                                toast({
                                  title: "Item Removed",
                                  description: `${item.item_name} removed from order`,
                                })
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to remove item",
                                  variant: "destructive",
                                })
                              }
                            }}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-yellow-400">Unpaid Total:</span>
                    <span className="text-yellow-400">
                      {selectedOrder.order_items
                        ?.filter((item: any) => !item.is_paid)
                        ?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)
                        ?.toFixed(2)}{" "}
                      EGP
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPaymentDialog(false)}
                className="flex-1 border-slate-600 text-white hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedOrder && completePayment(selectedOrder)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cafe Payment Dialog */}
      <Dialog open={cafePaymentDialog} onOpenChange={setCafePaymentDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Pay Cafe Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <CafePaymentSelector
                order={selectedOrder}
                onPayment={(selectedItems) => completeCafePayment(selectedItems)}
                onCancel={() => setCafePaymentDialog(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Paid Order Editor Dialog */}
      <PaidOrderEditor
        isOpen={editPaidOrderDialog}
        onClose={() => {
          setEditPaidOrderDialog(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
        onOrderUpdated={async () => {
          await dispatch(fetchOrders({} as any))
          setEditPaidOrderDialog(false)
          setSelectedOrder(null)
        }}
      />
    </div>
  )
}

export default CurrentOrders
