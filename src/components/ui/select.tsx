"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// Mobile detection – renders a native <select> on touch devices for
// reliable tap handling and the native iOS/Android picker.
// ---------------------------------------------------------------------------

const MobileContext = React.createContext<{
  isMobile: boolean
  value: string | undefined
  onValueChange: ((value: string) => void) | undefined
  items: { value: string; label: string }[]
  registerItem: (value: string, label: string) => void
}>({
  isMobile: false,
  value: undefined,
  onValueChange: undefined,
  items: [],
  registerItem: () => {},
})

// Touch capability is effectively static after mount, so no subscription is
// needed. The server snapshot returns false to keep SSR output stable; the
// client snapshot reads the real value on first render without setState.
const subscribeNoop = () => () => {}
const getTouchSnapshot = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0
const getTouchServerSnapshot = () => false

function useIsTouchDevice() {
  return React.useSyncExternalStore(
    subscribeNoop,
    getTouchSnapshot,
    getTouchServerSnapshot
  )
}

// ---------------------------------------------------------------------------
// Select root – wraps Base UI Select and provides mobile context
// ---------------------------------------------------------------------------

type SelectProps = {
  children?: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  required?: boolean
  name?: string
}

function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  ...props
}: SelectProps) {
  const isMobile = useIsTouchDevice()
  const [items, setItems] = React.useState<{ value: string; label: string }[]>(
    []
  )
  const registeredRef = React.useRef(new Set<string>())

  const registerItem = React.useCallback((itemValue: string, label: string) => {
    if (!registeredRef.current.has(itemValue)) {
      registeredRef.current.add(itemValue)
      setItems((prev) => [...prev, { value: itemValue, label }])
    }
  }, [])

  if (isMobile) {
    return (
      <MobileContext.Provider
        value={{ isMobile, value, onValueChange, items, registerItem }}
      >
        {children}
      </MobileContext.Provider>
    )
  }

  return (
    <MobileContext.Provider
      value={{ isMobile: false, value, onValueChange, items, registerItem }}
    >
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange as SelectPrimitive.Root.Props<string>["onValueChange"]}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </MobileContext.Provider>
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, placeholder, ...props }: SelectPrimitive.Value.Props & { placeholder?: string }) {
  const { isMobile, value, items } = React.useContext(MobileContext)

  if (isMobile) {
    const selectedItem = items.find((item) => item.value === value)
    return (
      <span
        data-slot="select-value"
        className={cn("flex flex-1 text-left", !selectedItem && "text-muted-foreground", className)}
      >
        {selectedItem?.label || placeholder || String(value || "")}
      </span>
    )
  }

  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      placeholder={placeholder}
      {...props}
    >
      {(currentValue: unknown) => {
        const v =
          typeof currentValue === "string"
            ? currentValue
            : currentValue == null
              ? ""
              : String(currentValue)
        if (!v) return placeholder ?? null
        const selectedItem = items.find((item) => item.value === v)
        return selectedItem?.label ?? v
      }}
    </SelectPrimitive.Value>
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  const { isMobile, value, onValueChange, items } = React.useContext(MobileContext)

  if (isMobile) {
    return (
      <div className="relative">
        <div
          data-slot="select-trigger"
          data-size={size}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent py-2 pr-2 pl-3 text-sm transition-colors outline-none select-none data-[size=default]:h-10 data-[size=sm]:h-8 data-[size=sm]:rounded-[min(var(--radius-md),10px)] dark:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className
          )}
        >
          {children}
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        </div>
        <select
          value={String(value || "")}
          onChange={(e) => onValueChange?.(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Select option"
        >
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent py-2 pr-2 pl-3 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-10 data-[size=sm]:h-8 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  const { isMobile } = React.useContext(MobileContext)

  if (isMobile) {
    // On mobile, we still render children so SelectItem can register,
    // but we hide the visual popup.
    return <div className="hidden">{children}</div>
  }

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn("relative isolate z-50 max-h-(--available-height) min-w-[max(var(--anchor-width),200px)] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  value,
  ...props
}: SelectPrimitive.Item.Props & { value: string }) {
  const { isMobile, registerItem } = React.useContext(MobileContext)

  // Extract text from children for the native <select> option label
  const label = React.useMemo(() => {
    if (typeof children === "string") return children
    if (typeof children === "number") return String(children)
    if (Array.isArray(children)) return children.map(c => typeof c === "string" || typeof c === "number" ? String(c) : "").join("")
    return String(value || "")
  }, [children, value])

  React.useEffect(() => {
    if (value) {
      registerItem(value, label)
    }
  }, [value, label, registerItem])

  if (isMobile) {
    return null
  }

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-3 text-sm outline-hidden select-none hover:bg-accent focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      value={value}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
