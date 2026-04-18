"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "./utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 w-fit items-center justify-center rounded-xl bg-[#EBF2F5] p-1 text-[#7A7068]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-all",
        "text-[#7A7068] hover:text-[#0D5C7A]",
        "data-[state=active]:bg-white data-[state=active]:text-[#0D5C7A] data-[state=active]:font-semibold data-[state=active]:border-[#EDEAE4] data-[state=active]:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C7A]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
