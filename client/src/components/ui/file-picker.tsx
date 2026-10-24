import React, { useEffect, useId, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilePickerProps = {
  id?: string;
  name?: string;
  accept?: string;
  disabled?: boolean;
  /** Pass to control the shown file (null clears the native input too); omit to let the picker track it. */
  value?: File | null;
  onChange: (file: File | null) => void;
  "aria-describedby"?: string;
  className?: string;
};

/** Native file input, visually hidden, with a button-styled label and the chosen file name. */
export function FilePicker({ id, name, accept, disabled, value, onChange, className, "aria-describedby": describedBy }: FilePickerProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const ref = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState<File | null>(null);
  const file = value === undefined ? own : value;
  useEffect(() => { if (!file && ref.current) ref.current.value = ""; }, [file]);
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-3", className)}>
      <input
        ref={ref}
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled}
        aria-describedby={describedBy}
        className="peer sr-only"
        onChange={event => {
          const next = event.target.files?.[0] ?? null;
          setOwn(next);
          onChange(next);
        }}
      />
      <label
        htmlFor={inputId}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 cursor-pointer px-4 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          disabled && "pointer-events-none border-border bg-secondary text-muted-foreground",
        )}
      >
        ფაილის არჩევა
      </label>
      <span className={cn("min-w-0 truncate text-sm", file ? "text-foreground" : "text-muted-foreground")}>{file ? file.name : "ფაილი არ არის არჩეული"}</span>
    </div>
  );
}
