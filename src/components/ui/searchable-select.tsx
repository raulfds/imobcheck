'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface Option {
    id: string;
    label: string;
    searchValue: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Selecione...",
    searchPlaceholder = "Buscar...",
    emptyText = "Nenhum resultado encontrado.",
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const filteredOptions = options.filter((option) =>
        option.searchValue.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find((option) => option.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between h-12 md:h-14 rounded-xl md:rounded-2xl bg-muted/40 border-none shadow-inner font-bold px-4 md:px-6 focus:ring-primary/20 text-sm md:text-base hover:bg-muted/60 transition-all",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 bg-card rounded-2xl border-none shadow-2xl w-[--radix-popover-trigger-width] z-[100]">
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                        className="pl-9 h-11 border-none bg-muted/60 rounded-xl font-bold focus-visible:ring-primary/20 placeholder:font-medium"
                    />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                    {filteredOptions.length === 0 ? (
                        <p className="py-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">
                            {emptyText}
                        </p>
                    ) : (
                        filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                className={cn(
                                    "flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-colors text-left",
                                    value === option.id
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                )}
                                onClick={() => {
                                    onValueChange(option.id);
                                    setOpen(false);
                                    setSearch("");
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <span className="truncate">{option.label}</span>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
