import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export function KeywordEditor({
    values,
    onChange,
}: {
    values: string[];
    onChange: (vals: string[]) => void;
}) {
    const [draft, setDraft] = useState<string>("");

    function add() {
        const trimmed = draft.trim();
        if (!trimmed) return;
        if (values.includes(trimmed)) {
            setDraft("");
            return;
        }
        onChange([...(values ?? []), trimmed]);
        setDraft("");
    }

    function remove(val: string) {
        onChange(values.filter(v => v !== val));
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            add();
        }
    }

    return (
        <div>
            <div className="flex gap-2">
                <Input
                    placeholder="Add a keyword and hit Enter"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <Button type="button" variant="secondary" onClick={add}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                {values.length === 0 && (
                    <div className="text-sm text-slate-500">No keywords yet.</div>
                )}
                {values.map(val => (
                    <span
                        key={val}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 text-sm"
                    >
                        {val}
                        <button
                            type="button"
                            className="ml-1 rounded-full hover:bg-amber-100 p-0.5"
                            aria-label={`Remove ${val}`}
                            onClick={() => remove(val)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}
