import { useRef } from "react";
import { Badge } from "@/components/ui/badge";

const TEMPLATE_VARIABLES = [
  { token: "{cliente}", label: "Nome do cliente", example: "Ana Lima" },
  { token: "{servico}", label: "Servico", example: "Corte + Escova" },
  { token: "{data}", label: "Data", example: "25/06/2025" },
  { token: "{hora}", label: "Horario", example: "14:30" },
  { token: "{profissional}", label: "Profissional", example: "Maria" },
  { token: "{salao}", label: "Salao", example: "Studio Bella" },
];

function buildPreview(template: string): string {
  let result = template;
  for (const v of TEMPLATE_VARIABLES) {
    result = result.replaceAll(v.token, v.example);
  }
  return result;
}

interface TemplateEditorProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function TemplateEditor({ label, placeholder, value, onChange }: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (token: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + token);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);

    // Reposiciona o cursor apos o token inserido
    requestAnimationFrame(() => {
      el.focus();
      const newCursor = start + token.length;
      el.setSelectionRange(newCursor, newCursor);
    });
  };

  const preview = value.trim() ? buildPreview(value) : "";

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>

      <textarea
        ref={textareaRef}
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[64px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Chips de variaveis */}
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_VARIABLES.map((v) => (
          <button
            key={v.token}
            type="button"
            title={v.label}
            onClick={() => insertVariable(v.token)}
            className="inline-flex items-center"
          >
            <Badge
              variant="secondary"
              className="cursor-pointer text-[11px] font-mono hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {v.token}
            </Badge>
          </button>
        ))}
      </div>

      {/* Preview com dados de exemplo */}
      {preview && (
        <div className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="mr-1 font-medium text-foreground">Preview:</span>
          {preview}
        </div>
      )}
    </div>
  );
}
