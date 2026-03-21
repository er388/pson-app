import { useState, useEffect } from 'react';
import { Cloud, Check, Upload, Download, RefreshCw, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { exportAppData } from '@/lib/useStore';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type CloudProvider = 'googleDrive' | 'oneDrive' | 'dropbox';

interface CloudConnection {
  provider: CloudProvider;
  connected: boolean;
}

// ─── CredentialField ──────────────────────────────────────────────────────────

interface CredentialFieldProps {
  label: string;
  storageKey: string;
  placeholder?: string;
  helpText?: string;
}

function CredentialField({ label, storageKey, placeholder, helpText }: CredentialFieldProps) {
  const [value, setValue] = useState('');
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setValue(stored);
      setIsSaved(true);
    }
  }, [storageKey]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    localStorage.setItem(storageKey, trimmed);
    setValue(trimmed);
    setIsSaved(true);
    setIsEditing(false);
    setDraft('');
  };

  const handleEdit = () => {
    setDraft(value);
    setIsSaved(false);
    setIsEditing(true);
  };

  const handleDelete = () => {
    localStorage.removeItem(storageKey);
    setValue('');
    setDraft('');
    setIsSaved(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft('');
    setIsEditing(false);
    if (value) setIsSaved(true);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      {/* Input row — ορατό όταν δεν είναι saved */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isSaved ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-20 opacity-100'
        }`}
      >
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder ?? 'Εισάγετε κλειδί...'}
            className="flex-1 h-8 px-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!draft.trim()}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-input bg-card hover:bg-accent disabled:opacity-40 transition-colors"
            title="Αποθήκευση"
            aria-label="Αποθήκευση"
          >
            <Check size={15} className="text-green-500" />
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-input bg-card hover:bg-accent transition-colors"
              title="Ακύρωση"
              aria-label="Ακύρωση"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Saved row — ορατό όταν είναι saved */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isSaved ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-input bg-muted/40">
          <span className="flex-1 text-sm text-muted-foreground tracking-[0.3em] select-none">
            ••••••••••••
          </span>
          <button
            type="button"
            onClick={handleEdit}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
            title="Επεξεργασία"
            aria-label="Επεξεργασία"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
            title="Διαγραφή"
            aria-label="Διαγραφή"
          >
            <Trash2 size={13} className="text-destructive" />
          </button>
        </div>
      </div>

      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useCloudBackupSettings() {
  const [autoBackup, setAutoBackup] = useState(() => {
    return localStorage.getItem('Pson-auto-backup') === 'true';
  });
  const [connections, setConnections] = useState<CloudConnection[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('Pson-cloud-connections') || '[]');
    } catch { return []; }
  });

  const toggleAutoBackup = (val: boolean) => {
    setAutoBackup(val);
    localStorage.setItem('Pson-auto-backup', String(val));
  };

  const disconnect = (provider: CloudProvider) => {
    setConnections(prev => {
      const next = prev.filter(c => c.provider !== provider);
      localStorage.setItem('Pson-cloud-connections', JSON.stringify(next));
      return next;
    });
  };

  const isConnected = (provider: CloudProvider) =>
    connections.find(c => c.provider === provider)?.connected || false;

  return { autoBackup, toggleAutoBackup, isConnected, disconnect };
}

// ─── OAuth config ─────────────────────────────────────────────────────────────

const OAUTH_CONFIGS: Record<CloudProvider, {
  name: string;
  icon: string;
  credentialLabel: string;
  credentialKey: string;
  credentialPlaceholder: string;
  credentialHelp: string;
}> = {
  googleDrive: {
    name: 'Google Drive',
    icon: '/icons/google-drive.png',
    credentialLabel: 'Client ID',
    credentialKey: 'pson_gdrive_client_id',
    credentialPlaceholder: 'xxxx.apps.googleusercontent.com',
    credentialHelp: 'Google Cloud Console → APIs & Services → Credentials',
  },
  oneDrive: {
    name: 'OneDrive',
    icon: '/icons/onedrive.png',
    credentialLabel: 'Application (client) ID',
    credentialKey: 'pson_onedrive_client_id',
    credentialPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    credentialHelp: 'Azure Portal → App registrations → Overview',
  },
  dropbox: {
    name: 'Dropbox',
    icon: '/icons/dropbox.png',
    credentialLabel: 'App Key',
    credentialKey: 'pson_dropbox_app_key',
    credentialPlaceholder: 'xxxxxxxxxxxxxxx',
    credentialHelp: 'Dropbox App Console → Settings',
  },
};

const PROVIDERS: CloudProvider[] = ['googleDrive', 'oneDrive', 'dropbox'];

// ─── Main component ───────────────────────────────────────────────────────────

export default function CloudBackup() {
  const { t } = useI18n();
  const { autoBackup, toggleAutoBackup, isConnected, disconnect } = useCloudBackupSettings();
  const [disconnectTarget, setDisconnectTarget] = useState<CloudProvider | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  const handleConnect = (provider: CloudProvider) => {
    const key = localStorage.getItem(OAUTH_CONFIGS[provider].credentialKey);
    if (!key) {
      toast({
        title: OAUTH_CONFIGS[provider].name,
        description: 'Πρώτα εισάγετε το Client ID / App Key παρακάτω.',
      });
      return;
    }
    toast({
      title: OAUTH_CONFIGS[provider].name,
      description: 'Η σύνδεση OAuth απαιτεί ρύθμιση API keys. Δες τις οδηγίες στο CLOUD_BACKUP_SETUP.md.',
    });
  };

  const handleBackupNow = () => {
    const connectedProviders = PROVIDERS.filter(isConnected);
    if (connectedProviders.length === 0) {
      const data = exportAppData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pson-io-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: t('backupSuccess') });
      return;
    }

    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      toast({ title: t('backupSuccess') });
    }, 1000);
  };

  const handleRestore = () => {
    toast({
      title: t('restoreFromCloud'),
      description: t('noBackupsFound'),
    });
  };

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Cloud size={14} /> {t('cloudBackup')}
      </h2>

      <div className="space-y-2">

        {/* Provider cards */}
        {PROVIDERS.map(provider => {
          const config = OAUTH_CONFIGS[provider];
          const connected = isConnected(provider);
          return (
            <div key={provider} className="rounded-xl bg-card border border-border overflow-hidden">

              {/* Header row */}
              <div className="flex items-center gap-3 p-3">
                <img src={config.icon} alt={config.name} className="w-6 h-6 object-contain" />
                <span className="flex-1 text-sm font-medium text-foreground">{config.name}</span>
                {connected ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Check size={14} /> {t('connected')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={() => setDisconnectTarget(provider)}
                    >
                      Αποσύνδεση
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-lg"
                    onClick={() => handleConnect(provider)}
                  >
                    {t('connect')}
                  </Button>
                )}
              </div>

              {/* Credential field — πάντα ορατό, κρύβεται μόνο το input όταν saved */}
              <div className="px-3 pb-3 border-t border-border/50 pt-2.5 bg-muted/20">
                <CredentialField
                  label={config.credentialLabel}
                  storageKey={config.credentialKey}
                  placeholder={config.credentialPlaceholder}
                  helpText={config.credentialHelp}
                />
              </div>

            </div>
          );
        })}

        {/* Auto backup toggle */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
          <RefreshCw size={16} className="text-muted-foreground" />
          <span className="flex-1 text-sm font-medium text-foreground">{t('autoBackup')}</span>
          <Switch checked={autoBackup} onCheckedChange={toggleAutoBackup} />
        </div>

        {/* Manual backup */}
        <button
          type="button"
          onClick={handleBackupNow}
          disabled={backingUp}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left transition-colors hover:bg-secondary/50 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('backupNow')}</p>
          </div>
        </button>

        {/* Restore */}
        <button
          type="button"
          onClick={handleRestore}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left transition-colors hover:bg-secondary/50"
        >
          <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
            <Download size={18} className="text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('restoreFromCloud')}</p>
          </div>
        </button>

      </div>

      {/* Disconnect dialog */}
      <AlertDialog open={!!disconnectTarget} onOpenChange={() => setDisconnectTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Αποσύνδεση</AlertDialogTitle>
            <AlertDialogDescription>
              Θέλετε να αποσυνδεθείτε από {disconnectTarget ? OAUTH_CONFIGS[disconnectTarget].name : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (disconnectTarget) {
                  disconnect(disconnectTarget);
                  setDisconnectTarget(null);
                }
              }}
            >
              Αποσύνδεση
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </section>
  );
}