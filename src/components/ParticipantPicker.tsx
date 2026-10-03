"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

type User = { id: string; name: string; email: string };

type ParticipantPickerProps = {
  value: string[];
  onChange: (ids: string[]) => void;
};

export function ParticipantPicker({ value, onChange }: ParticipantPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selectedNames, setSelectedNames] = useState<Map<string, string>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const { users } = await res.json() as { users: User[] };
      setResults(users);
    } catch {
      // ignore fetch errors
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, fetchUsers]);

  function addParticipant(user: User) {
    if (value.includes(user.id)) return;
    setSelectedNames((prev) => new Map(prev).set(user.id, user.name));
    onChange([...value, user.id]);
    setSearch("");
    setResults([]);
  }

  function removeParticipant(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  const filteredResults = results.filter((u) => !value.includes(u.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filteredResults.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border bg-background shadow-md">
            {filteredResults.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => addParticipant(user)}
                >
                  <span className="font-medium">{user.name}</span>
                  <span className="ml-2 text-muted-foreground">{user.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {selectedNames.get(id) ?? id}
              <button
                type="button"
                aria-label="Remove participant"
                className="ml-0.5 rounded-full hover:text-destructive"
                onClick={() => removeParticipant(id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
