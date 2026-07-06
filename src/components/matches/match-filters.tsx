"use client";

import {
  EDUCATION_LEVELS,
  RELIGIOUS_LEVELS,
  OCCUPATIONS,
} from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryCombobox } from "@/components/ui/country-combobox";

interface MatchFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

export function MatchFilters({ filters, onChange }: MatchFiltersProps) {
  const update = (key: string, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Country</Label>
            <CountryCombobox
              value={filters.country ?? ""}
              onChange={(v) => update("country", v)}
              placeholder="Search countries..."
            />
            {filters.country && (
              <button
                type="button"
                className="text-xs text-emerald-600 hover:underline"
                onClick={() => update("country", "")}
              >
                Clear country filter
              </button>
            )}
          </div>
          <div className="space-y-2">
            <Label>Min Age</Label>
            <Select value={filters.minAge ?? ""} onValueChange={(v) => update("minAge", v)}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 43 }, (_, i) => (
                  <SelectItem key={i} value={String(18 + i)}>{18 + i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Max Age</Label>
            <Select value={filters.maxAge ?? ""} onValueChange={(v) => update("maxAge", v)}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 43 }, (_, i) => (
                  <SelectItem key={i} value={String(18 + i)}>{18 + i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Religion</Label>
            <Select value={filters.religiousLevel ?? ""} onValueChange={(v) => update("religiousLevel", v)}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {RELIGIOUS_LEVELS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Education</Label>
            <Select value={filters.education ?? ""} onValueChange={(v) => update("education", v)}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Occupation</Label>
            <Select value={filters.occupation ?? ""} onValueChange={(v) => update("occupation", v)}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {OCCUPATIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
