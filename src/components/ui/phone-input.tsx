import * as React from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES_WITH_PHONE, type CountryWithPhone } from "@/lib/constants/countries";

/**
 * Platform Logic: Global Communication Node
 * Orchestrates multi-national identity verification and registry entry.
 */
interface PhoneInputProps {
  value: string;
  countryCode: string;
  onValueChange: (phone: string) => void;
  onCountryCodeChange: (code: string, country: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const POPULAR_ISO = ["BD", "IN", "AE", "SA", "US", "GB", "CA"];

export function PhoneInput({
  value,
  countryCode,
  onValueChange,
  onCountryCodeChange,
  placeholder = "Enter identifier sequence",
  required = false,
  disabled = false,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCountry = COUNTRIES_WITH_PHONE.find((c) => c.phoneCode === countryCode) || COUNTRIES_WITH_PHONE[0];

  const handleSelectCountry = (country: CountryWithPhone) => {
    onCountryCodeChange(country.phoneCode, country.code);
    setOpen(false);
  };

  return (
    <div className={cn("flex gap-3", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-[120px] justify-between px-3 h-12 rounded-xl border-2 border-border/40 bg-background/50 transition-all duration-300",
              "hover:border-primary/40 hover:bg-primary/5 focus:ring-4 focus:ring-primary/10",
            )}
            disabled={disabled}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-lg grayscale-[0.5] group-hover:grayscale-0 transition-all">
                {selectedCountry.flag}
              </span>
              <span className="text-[11px] font-black tracking-widest text-foreground">
                {selectedCountry.phoneCode}
              </span>
            </span>
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-30" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0 rounded-2xl border-border/40 bg-background/90 backdrop-blur-2xl shadow-3xl"
          align="start"
          sideOffset={8}
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search registry..."
              className="h-12 text-[10px] font-black uppercase tracking-widest italic"
            />
            <CommandList className="max-h-[350px] p-2">
              <CommandEmpty className="py-6 text-[10px] font-bold uppercase tracking-widest opacity-40">
                Registry entry not found.
              </CommandEmpty>

              <CommandGroup heading="Priority Enclosures">
                {COUNTRIES_WITH_PHONE.filter((c) => POPULAR_ISO.includes(c.code)).map((country) => (
                  <CountryItem
                    key={country.code}
                    country={country}
                    active={countryCode === country.phoneCode}
                    onSelect={handleSelectCountry}
                  />
                ))}
              </CommandGroup>

              <CommandGroup heading="Global Registry">
                {COUNTRIES_WITH_PHONE.filter((c) => !POPULAR_ISO.includes(c.code)).map((country) => (
                  <CountryItem
                    key={country.code}
                    country={country}
                    active={countryCode === country.phoneCode}
                    onSelect={handleSelectCountry}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        value={value}
        onChange={(e) => onValueChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="flex-1 h-12 rounded-xl border-2 font-mono tracking-widest text-sm"
      />
    </div>
  );
}

/**
 * Internal Node: Country Selection Item
 */
function CountryItem({
  country,
  active,
  onSelect,
}: {
  country: CountryWithPhone;
  active: boolean;
  onSelect: (c: CountryWithPhone) => void;
}) {
  return (
    <CommandItem
      value={`${country.name} ${country.phoneCode}`}
      onSelect={() => onSelect(country)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer",
        "data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground",
      )}
    >
      <div className="flex h-5 w-5 items-center justify-center shrink-0">
        {active ? <Check className="h-4 w-4 stroke-[3px]" /> : <span className="text-lg">{country.flag}</span>}
      </div>
      <span className="flex-1 text-[10px] font-black uppercase tracking-widest truncate">{country.name}</span>
      <span className={cn("text-[10px] font-mono opacity-50", active && "opacity-100")}>{country.phoneCode}</span>
    </CommandItem>
  );
}
