"use client";

import { Plus, X } from "lucide-react";

export interface SpecRow {
  key: string;
  value: string;
}

interface Props {
  value: SpecRow[];
  onChange: (rows: SpecRow[]) => void;
}

export default function SellerSpecsEditor({ value, onChange }: Props) {
  const update = (i: number, field: "key" | "value", v: string) => {
    onChange(value.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { key: "", value: "" }]);

  return (
    <div>
      <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Specifications</label>
      {value.length === 0 && <p className="text-xs text-dark-500 mb-2">No specifications added yet.</p>}
      <div className="space-y-2">
        {value.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={row.key} onChange={e => update(i, "key", e.target.value)} placeholder="e.g. Battery" className="w-2/5 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors" />
            <input value={row.value} onChange={e => update(i, "value", e.target.value)} placeholder="e.g. 5000 mAh" className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors" />
            <button type="button" onClick={() => remove(i)} className="p-3 text-dark-400 hover:text-red-400 transition-colors shrink-0" aria-label="Remove specification"><X size={16} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 text-xs text-gold-400 hover:text-gold-300 inline-flex items-center gap-1 transition-colors"><Plus size={14} /> Add Specification</button>
    </div>
  );
}
