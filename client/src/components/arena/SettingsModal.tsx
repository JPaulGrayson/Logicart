import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, Check, X, Eye, EyeOff } from "lucide-react";

interface APIKeys {
  openai: string;
  gemini: string;
  anthropic: string;
  xai: string;
}

const STORAGE_KEY = "logicart_arena_api_keys";
const OLD_STORAGE_KEY = "logigo_arena_api_keys";

function migrateArenaKeys() {
  const oldValue = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldValue !== null && localStorage.getItem(STORAGE_KEY) === null) {
    localStorage.setItem(STORAGE_KEY, oldValue);
    localStorage.removeItem(OLD_STORAGE_KEY);
  }
}

migrateArenaKeys();

export function getStoredAPIKeys(): APIKeys {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return { openai: "", gemini: "", anthropic: "", xai: "" };
}

export function saveAPIKeys(keys: APIKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function hasAnyAPIKeys(): boolean {
  const keys = getStoredAPIKeys();
  return !!(keys.openai || keys.gemini || keys.anthropic || keys.xai);
}

interface SettingsModalProps {
  onKeysChange?: () => void;
}

export default function SettingsModal({ onKeysChange }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<APIKeys>({ openai: "", gemini: "", anthropic: "", xai: "" });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setKeys(getStoredAPIKeys());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    saveAPIKeys(keys);
    setSaved(true);
    onKeysChange?.();
    setTimeout(() => setOpen(false), 500);
  };

  const handleClear = () => {
    const emptyKeys = { openai: "", gemini: "", anthropic: "", xai: "" };
    setKeys(emptyKeys);
    saveAPIKeys(emptyKeys);
    onKeysChange?.();
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const providers = [
    { id: "openai", name: "OpenAI", placeholder: "sk-...", color: "text-green-400" },
    { id: "gemini", name: "Google Gemini", placeholder: "AIza...", color: "text-blue-400" },
    { id: "anthropic", name: "Anthropic Claude", placeholder: "sk-ant-...", color: "text-orange-400" },
    { id: "xai", name: "xAI Grok", placeholder: "xai-...", color: "text-purple-400" },
  ];

  const configuredCount = Object.values(keys).filter(k => k.trim()).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-[#30363d] gap-2" data-testid="button-settings">
          <Settings className="w-4 h-4" />
          API Keys
          {configuredCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {configuredCount}/4
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#161b22] border-[#30363d] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5 text-blue-400" />
            API Key Settings (BYOK)
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-gray-400 mb-4">
          Bring Your Own Keys for complete control. Keys are stored locally in your browser and sent securely with each request.
        </div>

        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="space-y-2">
              <Label htmlFor={provider.id} className={`text-sm ${provider.color}`}>
                {provider.name}
                {keys[provider.id as keyof APIKeys] && (
                  <Check className="w-3 h-3 inline ml-2 text-green-500" />
                )}
              </Label>
              <div className="relative">
                <Input
                  id={provider.id}
                  type={showKeys[provider.id] ? "text" : "password"}
                  value={keys[provider.id as keyof APIKeys]}
                  onChange={(e) => setKeys({ ...keys, [provider.id]: e.target.value })}
                  placeholder={provider.placeholder}
                  className="bg-[#0d1117] border-[#30363d] text-white pr-10"
                  data-testid={`input-key-${provider.id}`}
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(provider.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#30363d]">
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            data-testid="button-clear-keys"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button
            onClick={handleSave}
            className={saved ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"}
            data-testid="button-save-keys"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              "Save Keys"
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Keys are stored in your browser's localStorage and never sent to our servers for storage.
        </div>
      </DialogContent>
    </Dialog>
  );
}
