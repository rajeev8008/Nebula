import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const buttonVariants = {
  default: "bg-gradient-to-r from-orange-600 to-yellow-600 text-black hover:from-orange-500 hover:to-yellow-500",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-orange-300 bg-transparent hover:bg-orange-900/20 text-orange-300",
  secondary: "bg-slate-700 text-white hover:bg-slate-600",
  ghost: "hover:bg-orange-900/20 hover:text-orange-300",
  link: "text-orange-400 underline-offset-4 hover:underline",
};

const sizeVariants = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-12 px-8 py-3 text-lg",
  icon: "h-10 w-10",
};

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg shadow-orange-500/50 hover:shadow-orange-400/75",
          buttonVariants[variant] || buttonVariants.default,
          sizeVariants[size] || sizeVariants.default,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
