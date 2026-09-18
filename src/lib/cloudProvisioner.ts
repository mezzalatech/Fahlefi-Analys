import { getSupabase } from './supabase';

export interface TableHealthStatus {
  name: string;
  label: string;
  status: 'READY' | 'MISSING' | 'ERROR';
  rowCount: number;
  error?: string;
}

export interface CloudHealthReport {
  isConfigured: boolean;
  isConnected: boolean;
  latencyMs: number;
  healthScore: number; // 0 - 100%
  tables: TableHealthStatus[];
  missingTables: string[];
}

export class CloudProvisioner {
  private static EXPECTED_TABLES = [
    { name: 'teams', label: 'Multi-Tenant Klub & Tim' },
    { name: 'master_players', label: 'Database Skuad Master' },
    { name: 'matches', label: 'Data Pertandingan' },
    { name: 'players', label: 'Statistik Pemain Laga' },
    { name: 'pitch_events', label: 'Tagging Aksi Lapangan' },
    { name: 'lineup_pakets', label: 'Paket Rotasi 5-Man' },
    { name: 'substitutions', label: 'Log Pergantian Pemain' },
    { name: 'users', label: 'Akun Staf & RBAC' }
  ];

  static async runDiagnostic(): Promise<CloudHealthReport> {
    const client = getSupabase();
    if (!client) {
      return {
        isConfigured: false,
        isConnected: false,
        latencyMs: 0,
        healthScore: 0,
        tables: this.EXPECTED_TABLES.map(t => ({ name: t.name, label: t.label, status: 'MISSING', rowCount: 0 })),
        missingTables: this.EXPECTED_TABLES.map(t => t.name)
      };
    }

    const start = performance.now();
    const tableResults: TableHealthStatus[] = [];
    const missing: string[] = [];

    for (const item of this.EXPECTED_TABLES) {
      try {
        const { data, count, error } = await client
          .from(item.name)
          .select('id', { count: 'exact', head: true });

        if (error) {
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            tableResults.push({ name: item.name, label: item.label, status: 'MISSING', rowCount: 0, error: 'Tabel belum dibuat' });
            missing.push(item.name);
          } else {
            tableResults.push({ name: item.name, label: item.label, status: 'ERROR', rowCount: 0, error: error.message });
          }
        } else {
          tableResults.push({ name: item.name, label: item.label, status: 'READY', rowCount: count || 0 });
        }
      } catch (e: any) {
        tableResults.push({ name: item.name, label: item.label, status: 'ERROR', rowCount: 0, error: e.message });
      }
    }

    const latencyMs = Math.round(performance.now() - start);
    const readyCount = tableResults.filter(t => t.status === 'READY').length;
    const healthScore = Math.round((readyCount / this.EXPECTED_TABLES.length) * 100);

    return {
      isConfigured: true,
      isConnected: readyCount > 0,
      latencyMs,
      healthScore,
      tables: tableResults,
      missingTables: missing
    };
  }
}
