"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ConnectKitButton } from "connectkit";

import { Button } from "@/components/ui/button";

import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen((current) => !current);
  };

  const close = () => {
    setOpen(false);
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight md:text-2xl"
          >
            Vaults
          </Link>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <ConnectKitButton />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ConnectKitButton />
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={open ? "close navigation menu" : "open navigation menu"}
            onClick={toggleOpen}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </nav>

      {open ? (
        <div className="border-t bg-background md:hidden">
          <div className="mx-auto flex flex-col gap-1.5 px-4 py-3 md:px-8">
            <a
              href="#"
              className="rounded-md px-2.5 py-2 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={close}
            >
              Docs
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
