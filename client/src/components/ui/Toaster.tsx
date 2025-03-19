import * as React from "react"
import * as Toast from "@radix-ui/react-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [type, setType] = React.useState<"success" | "error" | "warning">("success")

  React.useEffect(() => {
    const handleToast = (e: CustomEvent) => {
      setMessage(e.detail.message)
      setType(e.detail.type || "success")
      setOpen(true)
    }

    window.addEventListener('show-toast' as any, handleToast as EventListener)
    return () => {
      window.removeEventListener('show-toast' as any, handleToast as EventListener)
    }
  }, [])

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        className={cn(
          "fixed bottom-4 right-4 z-[100] w-[350px] rounded-lg p-4 shadow-lg",
          {
            "bg-green-500 text-white": type === "success",
            "bg-red-500 text-white": type === "error",
            "bg-yellow-500 text-white": type === "warning"
          }
        )}
      >
        <Toast.Title className="text-sm font-medium">{message}</Toast.Title>
      </Toast.Root>
      <Toast.Viewport />
    </Toast.Provider>
  )
} 