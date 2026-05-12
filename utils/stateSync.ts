import type { AppDispatch } from "@/store/store"
import { fetchOrders } from "@/store/slices/ordersSlice"
import { fetchRooms } from "@/store/slices/roomsSlice"
import { fetchAppointments } from "@/store/slices/appointmentsSlice"
import { fetchTransactions } from "@/store/slices/transactionsSlice"

class StateSyncManager {
  private dispatch: AppDispatch | null = null
  private refreshTimeouts: Set<NodeJS.Timeout> = new Set()

  setDispatch(dispatch: AppDispatch) {
    this.dispatch = dispatch
  }

  async refreshAll() {
    if (!this.dispatch) return

    try {
      await Promise.all([
        this.dispatch(fetchOrders(undefined)),
        this.dispatch(fetchRooms()),
        this.dispatch(fetchAppointments()),
        this.dispatch(fetchTransactions({})),
      ])
      console.log("All state refreshed successfully")
    } catch (error) {
      console.error("Error refreshing all state:", error)
    }
  }

  async refreshOrders() {
    if (!this.dispatch) return

    try {
      await this.dispatch(fetchOrders(undefined))
      await this.dispatch(fetchRooms())
      await this.dispatch(fetchAppointments())
      console.log("Orders and related state refreshed successfully")
    } catch (error) {
      console.error("Error refreshing orders:", error)
    }
  }

  async refreshAppointments() {
    if (!this.dispatch) return

    try {
      await this.dispatch(fetchAppointments())
      console.log("Appointments refreshed successfully")
    } catch (error) {
      console.error("Error refreshing appointments:", error)
    }
  }

  debouncedRefreshOrders(delay = 300) {
    this.clearTimeouts()

    const timeout = setTimeout(async () => {
      await this.refreshOrders()
      this.refreshTimeouts.delete(timeout)
    }, delay)

    this.refreshTimeouts.add(timeout)
  }

  debouncedRefreshAll(delay = 500) {
    this.clearTimeouts()

    const timeout = setTimeout(async () => {
      await this.refreshAll()
      this.refreshTimeouts.delete(timeout)
    }, delay)

    this.refreshTimeouts.add(timeout)
  }

  private clearTimeouts() {
    this.refreshTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.refreshTimeouts.clear()
  }

  preserveState(key: string, data: any) {
    try {
      sessionStorage.setItem(`stateSync_${key}`, JSON.stringify(data))
    } catch (error) {
      console.warn("Failed to preserve state:", error)
    }
  }

  restoreState(key: string) {
    try {
      const data = sessionStorage.getItem(`stateSync_${key}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn("Failed to restore state:", error)
      return null
    }
  }

  cleanup() {
    this.clearTimeouts()
  }
}

export const stateSync = new StateSyncManager()
