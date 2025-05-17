"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  name?: string
  required?: boolean
  className?: string
  triggerClassName?: string
  disabled?: boolean
  searchThreshold?: number // Minimum characters before filtering starts
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No options found.",
  name,
  required,
  className,
  triggerClassName,
  disabled = false,
  searchThreshold = 3, // Default to 3 characters
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  // Find the selected option label
  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder
  
  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery || searchQuery.length < searchThreshold) {
      return options
    }
    
    return options.filter((option) => {
      return option.label.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [options, searchQuery, searchThreshold])

  // Handle selection
  const handleSelect = (currentValue: string) => {
    const option = options.find(opt => opt.value === currentValue)
    if (option) {
      onValueChange(option.value)
      setOpen(false)
      setSearchQuery("")
    }
  }
  
  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            onClick={() => setOpen(!open)}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer",
              triggerClassName
            )}
          >
            <span className={cn(
              "text-sm truncate",
              !selectedOption && "text-muted-foreground"
            )}>
              {displayValue}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{width: "var(--radix-popover-trigger-width)", zIndex: 9999}}>
          <Command className="w-full">
            <CommandInput 
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              onValueChange={setSearchQuery}
              className="h-9"
              autoComplete="off"
            />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                  className="cursor-pointer hover:bg-accent"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {name && <input type="hidden" name={name} value={value || ""} required={required} />}
    </div>
  )
} 