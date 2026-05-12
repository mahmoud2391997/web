"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  PlayIcon,
  StopCircleIcon,
  ClockIcon,
  UserIcon,
  GamepadIcon,
  PlusIcon,
  MinusIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  UsersIcon,
  UserCheckIcon,
} from "lucide-react"
import { type Room, type Order, updateOrderItem } from "@/services/dbService"
import { showSessionEndNotification } from "@/utils/notificationUtils"
import CafeModal from "./CafeModal"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface RoomCardProps {
  room: Room
  onClick: () => void
  onEndSession: () => void
  onAdjustTime?: (roomId: string, adjustment: number) => void
  onStartSession?: () => void
  showStartButton?: boolean
  currentOrder?: Order | null
  onOrderUpdated?: () => void
  onModeChange?: (roomId: string, mode: "single" | "multiplayer") => void
}

const RoomCard = ({
  room,
  onClick,
  onEndSession,
  onAdjustTime,
  onStartSession,
  showStartButton,
  currentOrder,
  onOrderUpdated,
  onModeChange,
}: RoomCardProps) => {
  const [timeDisplay, setTimeDisplay] = useState<string>("")
  const [hasNotified, setHasNotified] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [showCafeModal, setShowCafeModal] = useState(false)
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(room.current_mode === "multiplayer")
  const { toast } = useToast()

  useEffect(() => {
    setIsMultiplayerMode(room.current_mode === "multiplayer")
  }, [room.current_mode])

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (room.status === "occupied" && room.current_customer_name && room.current_session_start) {
      // Check if session has already expired when component mounts
      if (room.current_session_end) {
        const now = new Date()
        const endTime = new Date(room.current_session_end)
        if (now >= endTime) {
          setTimeDisplay("EXPIRED")
          if (!hasNotified) {
            showSessionEndNotification(room.name, room.current_customer_name)
            setHasNotified(true)
          }
          return // Don't start timer if already expired
        }
      }

      if (!room.current_session_end) {
        // Open time: count up from start (start from 0)
        const updateElapsedTime = () => {
          const now = new Date()
          const startTime = new Date(room.current_session_start!)
          const diff = now.getTime() - startTime.getTime()
          const seconds = Math.floor(diff / 1000)
          setElapsedSeconds(seconds)

          const hours = Math.floor(seconds / 3600)
          const minutes = Math.floor((seconds % 3600) / 60)
          const remainingSeconds = seconds % 60

          setTimeDisplay(
            `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`,
          )
        }

        // Initial update
        updateElapsedTime()

        // Set up interval
        timer = setInterval(updateElapsedTime, 1000)
      } else {
        // Fixed time: count down to end
        timer = setInterval(() => {
          const now = new Date()
          const endTime = new Date(room.current_session_end!)
          const diff = endTime.getTime() - now.getTime()

          if (diff <= 0) {
            setTimeDisplay("EXPIRED")
            if (!hasNotified && room.current_customer_name) {
              showSessionEndNotification(room.name, room.current_customer_name)
              setHasNotified(true)
            }
            // Clear the timer when expired to prevent continued counting
            if (timer) {
              clearInterval(timer)
              timer = null
            }
            return
          }

          if (hasNotified && diff > 0) {
            setHasNotified(false)
          }

          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)

          setTimeDisplay(
            `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
          )
        }, 1000)
      }
      return () => {
        if (timer) clearInterval(timer)
      }
    } else {
      setHasNotified(false)
      setTimeDisplay("")
      setElapsedSeconds(0)
    }
  }, [
    room.status,
    room.current_session_end,
    room.current_session_start,
    hasNotified,
    room.current_customer_name,
    room.name,
  ])

  const calculateEstimatedCost = () => {
    if (!room.current_session_start) {
      return null
    }

    const hourlyRate = room.current_mode === "single" ? room.pricing_single : room.pricing_multiplayer

    const hours = elapsedSeconds / 3600
    return (hours * hourlyRate).toFixed(2)
  }

  const getStatusColor = () => {
    switch (room.status) {
      case "available":
        return "bg-green-500"
      case "occupied":
        return "bg-red-500"
      case "cleaning":
        return "bg-yellow-500"
      case "maintenance":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getConsoleColor = () => {
    if (room.console_type === "PS5") return "bg-blue-600"
    return "bg-green-600" // PS4
  }

  const handleTimeAdjustment = async (adjustment: number) => {
    // Preserve room state during adjustment
    const currentRoomState = {
      status: room.status,
      current_customer_name: room.current_customer_name,
      current_mode: room.current_mode,
      current_session_start: room.current_session_start,
    }

    // Immediate UI update
    if (onAdjustTime) {
      await onAdjustTime(room.id, adjustment)
    }

    // Force immediate refresh while preserving room state
    if (onOrderUpdated) {
      await onOrderUpdated()
    }
  }

  const handleModeChange = async (isMultiplayer: boolean) => {
    const newMode = isMultiplayer ? "multiplayer" : "single"

    try {
      // First update the room mode
      setIsMultiplayerMode(isMultiplayer)
      if (onModeChange) {
        await onModeChange(room.id, newMode)
      }

      // If there's an active order with room time items, update the pricing for existing items
      if (currentOrder && room.status === "occupied") {
        // Find the current unpaid room time item
        const roomTimeItem = currentOrder.order_items?.find(
          (item: any) => item.item_type === "room_time" && !item.is_paid,
        )

        if (roomTimeItem) {
          // Calculate elapsed time for the current session
          const startTime = new Date(room.current_session_start!)
          const now = new Date()
          const elapsedHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)

          // Get the new hourly rate for the new mode
          const newHourlyRate = newMode === "single" ? room.pricing_single : room.pricing_multiplayer

          // Update the existing room time item with new mode and pricing
          await updateOrderItem(roomTimeItem.id, {
            item_name: `${room.name} - ${newMode}${room.current_session_end ? "" : " (Open Time)"}`,
            unit_price: newHourlyRate,
            // Keep the same quantity (duration) but update total price based on new rate
            total_price: roomTimeItem.quantity * newHourlyRate,
          })

          toast({
            title: "Mode Changed",
            description: `Switched to ${newMode} mode. Pricing updated for current session.`,
            duration: 3000,
          })

          // Refresh the order to show updated items
          if (onOrderUpdated) {
            await onOrderUpdated()
          }
        }
      }
    } catch (error) {
      console.error("Error changing mode:", error)
      toast({
        title: "Error",
        description: "Failed to change mode",
        variant: "destructive",
        duration: 3000,
      })

      // Revert the switch if there was an error
      setIsMultiplayerMode(!isMultiplayer)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <GamepadIcon className="w-5 h-5" />
            {room.name}
          </CardTitle>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        </div>
        <div className="flex gap-2">
          <Badge className={`${getConsoleColor()} text-white border-0`}>{room.console_type}</Badge>
          {room.current_mode && (
            <Badge variant="outline" className="text-white border-slate-500">
              {room.current_mode === "single" ? "Single" : "Multi"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Single:</span>
            <span className="text-green-400">{room.pricing_single} EGP/hr</span>
          </div>
          <div className="flex justify-between">
            <span>Multi:</span>
            <span className="text-green-400">{room.pricing_multiplayer} EGP/hr</span>
          </div>
        </div>

        {room.status === "occupied" && room.current_customer_name && (
          <div
            className={`bg-slate-700 p-3 rounded-lg space-y-2 ${timeDisplay === "EXPIRED" ? "border-2 border-red-500 animate-pulse" : ""}`}
          >
            <div className="flex items-center gap-2 text-white">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">{room.current_customer_name}</span>
            </div>

            {/* Mode Toggle Switch - Show only when room is occupied */}
            <div className="flex items-center space-x-2">
              <UserCheckIcon className="w-4 h-4 text-white" />
              <Label htmlFor={`mode-toggle-${room.id}`} className="text-white text-sm">
                Single Player
              </Label>
              <Switch id={`mode-toggle-${room.id}`} checked={isMultiplayerMode} onCheckedChange={handleModeChange} />
              <UsersIcon className="w-4 h-4 text-white" />
              <Label htmlFor={`mode-toggle-${room.id}`} className="text-white text-sm">
                Multiplayer
              </Label>
            </div>

            <div className="flex items-center gap-2 text-white">
              <ClockIcon className="w-4 h-4" />
              <span className={`text-sm font-mono ${timeDisplay === "EXPIRED" ? "text-red-400 font-bold" : ""}`}>
                {timeDisplay || "00:00:00"}
              </span>
              {!room.current_session_end && <span className="ml-2 text-xs text-orange-400">(Open Time)</span>}
            </div>

            {/* Show current cost for active sessions */}
            {elapsedSeconds > 0 && (
              <div className="flex items-center gap-2 text-green-400">
                <DollarSignIcon className="w-4 h-4" />
                <span className="text-sm font-bold">
                  Current:{" "}
                  {(
                    (elapsedSeconds / 3600) *
                    (room.current_mode === "single" ? room.pricing_single : room.pricing_multiplayer)
                  ).toFixed(2)}{" "}
                  EGP
                </span>
              </div>
            )}

            {/* Time adjustment buttons for active sessions */}
            {room.current_session_end && (
              <div className="flex items-center gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => handleTimeAdjustment(-0.5)} className="h-6 w-6 p-0">
                  <MinusIcon className="w-3 h-3" />
                </Button>
                <span className="text-xs text-gray-400 px-2">Adjust Time</span>
                <Button size="sm" variant="outline" onClick={() => handleTimeAdjustment(0.5)} className="h-6 w-6 p-0">
                  <PlusIcon className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Show live estimated cost for active open time sessions */}
            {!room.current_session_end && (
              <div className="text-sm text-blue-400">Current Cost: ~{calculateEstimatedCost()} EGP</div>
            )}

            {/* Show remaining time for fixed time sessions */}
            {room.current_session_end && (
              <div className="text-sm text-yellow-400">
                {timeDisplay !== "EXPIRED" ? "Time Remaining" : "Session Expired"}
              </div>
            )}

            {/* Add time button for expired sessions */}
            {timeDisplay === "EXPIRED" && (
              <div className="flex justify-center">
                <Button
                  size="sm"
                  onClick={() => handleTimeAdjustment(0.5)}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <PlusIcon className="w-3 h-3 mr-1" />
                  Add 30min
                </Button>
              </div>
            )}

            {/* Show cafe items for current order */}
            {currentOrder &&
              currentOrder.order_items &&
              currentOrder.order_items.filter((item: any) => item.item_type === "cafe_product").length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-400 font-medium">
                    Café Items ({currentOrder.order_type === "combo" ? "Combo Order" : "Room + Café"}):
                  </div>
                  {currentOrder.order_items
                    .filter((item: any) => item.item_type === "cafe_product")
                    .map((item: any, index: number) => (
                      <div key={`${item.id || index}`} className="flex justify-between text-xs">
                        <span className="text-gray-300">
                          {item.quantity}x {item.item_name}
                        </span>
                        <span className="text-green-400">{item.total_price?.toFixed(2)} EGP</span>
                      </div>
                    ))}
                </div>
              )}
          </div>
        )}

        {/* Show final cost briefly after session ends */}
        {room.status === "available" && room.current_total_cost != null && (
          <div className="bg-green-900 p-2 rounded text-center">
            <div className="text-green-400 text-sm font-bold">
              Last Session: {room.current_total_cost.toFixed(2)} EGP
            </div>
          </div>
        )}

        <div className="space-y-2">
          {/* Main action buttons */}
          <div className="flex gap-2">
            {/* Show start button for paused orders */}
            {showStartButton && onStartSession && (
              <Button onClick={onStartSession} className="flex-1 bg-green-600 hover:bg-green-700">
                <PlayIcon className="w-4 h-4 mr-2" />
                Start
              </Button>
            )}

            {room.status === "available" && !showStartButton && (
              <Button onClick={onClick} className="flex-1 bg-green-600 hover:bg-green-700">
                <PlayIcon className="w-4 h-4 mr-2" />
                Book
              </Button>
            )}

            {room.status === "occupied" && (
              <Button onClick={onEndSession} variant="destructive" className="flex-1">
                <StopCircleIcon className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}

            {room.status === "cleaning" && (
              <Button disabled className="flex-1 bg-yellow-600">
                Cleaning...
              </Button>
            )}

            {room.status === "maintenance" && (
              <Button disabled className="flex-1 bg-orange-600">
                Maintenance
              </Button>
            )}
          </div>

          {/* Cafe button for occupied rooms */}
          {room.status === "occupied" && currentOrder && (
            <Button
              onClick={() => setShowCafeModal(true)}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="sm"
            >
              <ShoppingCartIcon className="w-4 h-4 mr-2" />
              Add Café Items
            </Button>
          )}
        </div>
      </CardContent>

      {/* Cafe Modal */}
      <CafeModal
        isOpen={showCafeModal}
        onClose={() => setShowCafeModal(false)}
        room={room}
        order={currentOrder}
        onOrderUpdated={() => {
          // Trigger immediate parent component updates
          if (onOrderUpdated) {
            onOrderUpdated()
          }
        }}
      />
    </Card>
  )
}

export default RoomCard
