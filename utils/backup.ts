export const createBackup = async () => {
  try {
    // Get all data from localStorage
    const data = {
      rooms: localStorage.getItem("rooms") || "[]",
      orders: localStorage.getItem("orders") || "[]",
      transactions: localStorage.getItem("transactions") || "[]",
      appointments: localStorage.getItem("appointments") || "[]",
      cafeProducts: localStorage.getItem("cafeProducts") || "[]",
      settings: localStorage.getItem("settings") || "{}",
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `gaming-lounge-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return { success: true, message: "Backup created successfully" }
  } catch (error) {
    return { success: false, message: "Failed to create backup" }
  }
}

export const validateBackupFile = (file: File): Promise<{ valid: boolean; data?: any; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        // Validate required fields
        const requiredFields = ["rooms", "orders", "transactions", "appointments", "cafeProducts"]
        const hasAllFields = requiredFields.every((field) => data.hasOwnProperty(field))

        if (!hasAllFields) {
          resolve({ valid: false, error: "Invalid backup file format" })
          return
        }

        resolve({ valid: true, data })
      } catch (error) {
        resolve({ valid: false, error: "Invalid JSON format" })
      }
    }

    reader.onerror = () => {
      resolve({ valid: false, error: "Failed to read file" })
    }

    reader.readAsText(file)
  })
}
