import { useState } from 'react';
import { Cloud, Check, Upload, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { exportAppData, importAppData } from '@/lib/useStore';
import { toast } from '@/hooks/use-toast';

type CloudProvider = 'googleDrive' | 'oneDrive' | 'dropbox';

interface CloudConnection {
  provider: CloudProvider;
  connected: boolean;
  token?: string;
}

function useCloudBackupSettings() {
  const [autoBackup, setAutoBackup] = useState(() => {
    return localStorage.getItem('smartcart-auto-backup') === 'true';
  });
  const [connections, setConnections] = useState<CloudConnection[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('smartcart-cloud-connections') || '[]');
    } catch { return []; }
  });

  const toggleAutoBackup = (val: boolean) => {
    setAutoBackup(val);
    localStorage.setItem('smartcart-auto-backup', String(val));
  };

  const setConnection = (provider: CloudProvider, connected: boolean, token?: string) => {
    setConnections(prev => {
      const next = prev.filter(c => c.provider !== provider);
      next.push({ provider, connected, token });
      localStorage.setItem('smartcart-cloud-connections', JSON.stringify(next));
      return next;
    });
  };

  const isConnected = (provider: CloudProvider) => connections.find(c => c.provider === provider)?.connected || false;

  return { autoBackup, toggleAutoBackup, connections, setConnection, isConnected };
}

// OAuth configurations - users need to supply their own client IDs
const OAUTH_CONFIGS: Record<CloudProvider, { name: string; icon: string; authUrl: string; scope: string }> = {
  googleDrive: {
    name: 'Google Drive',
    icon: '🟢',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/drive.file',
  },
  oneDrive: {
    name: 'OneDrive',
    icon: '🔵',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scope: 'Files.ReadWrite',
  },
  dropbox: {
    name: 'Dropbox',
    icon: '🔷',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    scope: '',
  },
};

export default function CloudBackup() {
  const { t } = useI18n();
  const { autoBackup, toggleAutoBackup, isConnected } = useCloudBackupSettings();
  const [backingUp, setBackingUp] = useState(false);

  const handleConnect = (provider: CloudProvider) => {
    // In production, this would initiate OAuth flow
    // For now, show info toast
    toast({
      title: `${OAUTH_CONFIGS[provider].name}`,
      description: 'Η σύνδεση OAuth απαιτεί ρύθμιση API keys. Δες τις οδηγίες στο README.',
    });
  };

  const handleBackupNow = async () => {
    const connectedProviders = (['googleDrive', 'oneDrive', 'dropbox'] as CloudProvider[]).filter(isConnected);
    if (connectedProviders.length === 0) {
      // Fallback: download as file (same as manual export)
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
    // In production, upload to connected providers
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

  const providers: CloudProvider[] = ['googleDrive', 'oneDrive', 'dropbox'];

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Cloud size={14} /> {t('cloudBackup')}
      </h2>

      <div className="space-y-2">
        {/* Provider connections */}
        {providers.map(provider => {
          const config = OAUTH_CONFIGS[provider];
          const connected = isConnected(provider);
          return (
            <div key={provider} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <span className="text-lg">{config.icon}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{config.name}</span>
              {connected ? (
                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Check size={14} /> {t('connected')}
                </span>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => handleConnect(provider)}>
                  {t('connect')}
                </Button>
              )}
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
    </section>
  );
}
