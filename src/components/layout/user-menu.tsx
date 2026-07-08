"use client"

import { signOut } from "next-auth/react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UserMenu({
  name,
  email,
  role,
  onDark = false,
}: {
  name: string
  email: string
  role: string
  onDark?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={
              onDark
                ? "h-8 gap-2 px-2 text-white hover:bg-white/15 hover:text-white"
                : "h-8 gap-2 px-2"
            }
          />
        }
      >
        <Avatar className="size-6">
          <AvatarFallback
            className={onDark ? "bg-white/20 text-xs text-white" : "text-xs"}
          >
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm sm:inline">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Role: {role}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
