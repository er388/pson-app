import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useProducts, useStores, usePurchaseHistory, useCompletedPurchases } from '@/lib/useStore';
import { CATEGORY_EMOJI, CATEGORY_COLORS, formatPrice } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Calendar, Store } from 'lucide-react';

const CHART_COLORS = ['hsl(152,55%,38%)', 'hsl(38,85%,55%)', 'hsl(0,72%,51%)', 'hsl(200,80%,50%)', 'hsl(280,60%,50%)', 'hsl(40,90%,50%)'];

type Period = 'week' | 'month' | 'all';

export default function StatsPage() {
  const { t, lang } = useI18n();
  const { products } = useProducts();
  const { stores } = useStores();
  const { history } = usePurchaseHistory();
  const { purchases } = useCompletedPurchases();
  const [period, setPeriod] = useState<Period>('all');
  const [filterStore, setFilterStore] = useState<string | null>(null);

  const getProductName = (pid: string) => {
    const p = products.find(pr => pr.id === pid);
    if (!p) return '?';
    return lang === 'el' ? p.name : (p.nameEn || p.name);
  };

  const getStoreName = (sid: string) => stores.find(s => s.id === sid)?.name || '?';

  const filteredHistory = useMemo(() => {
    let h = history;
    const now = Date.now();
    if (period === 'week') h = h.filter(r => now - new Date(r.date).getTime() < 7 * 86400000);
    if (period === 'month') h = h.filter(r => now - new Date(r.date).getTime() < 30 * 86400000);
    if (filterStore) h = h.filter(r => r.storeId === filterStore);
    return h;
  }, [history, period, filterStore]);

  const filteredPurchases = useMemo(() => {
    let p = purchases;
    const now = Date.now();
    if (period === 'week') p = p.filter(r => now - new Date(r.date).getTime() < 7 * 86400000);
    if (period === 'month') p = p.filter(r => now - new Date(r.date).getTime() < 30 * 86400000);
    if (filterStore) p = p.filter(r => r.storeIds.includes(filterStore));
    return p;
  }, [purchases, period, filterStore]);

  const monthlySpending = useMemo(() => {
    const map = new Map<string, number>();
    filteredPurchases.forEach(p => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + p.total);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));
  }, [filteredPurchases]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    filteredHistory.forEach(r => {
      map.set(r.productId, (map.get(r.productId) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pid, count]) => ({ name: getProductName(pid), count, pid }));
  }, [filteredHistory, products]);

  const categorySpending = useMemo(() => {
    const map = new Map<string, number>();
    filteredHistory.forEach(r => {
      const p = products.find(pr => pr.id === r.productId);
      if (!p) return;
      const amount = r.price * (1 - r.discount / 100);
      map.set(p.category, (map.get(p.category) || 0) + amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        name: `${CATEGORY_EMOJI[cat] || '📦'} ${t(cat as any)}`,
        value: Math.round(amount * 100) / 100,
        category: cat,
      }));
  }, [filteredHistory, products]);

  const storeComparison = useMemo(() => {
    const productStoreMap = new Map<string, Map<string, { total: number; count: number }>>();
    filteredHistory.forEach(r => {
      if (!productStoreMap.has(r.productId)) productStoreMap.set(r.productId, new Map());
      const storeMap = productStoreMap.get(r.productId)!;
      const existing = storeMap.get(r.storeId) || { total: 0, count: 0 };
      const price = r.price * (1 - r.discount / 100);
      storeMap.set(r.storeId, { total: existing.total + price, count: existing.count + 1 });
    });

    const result: { productId: string; name: string; stores: { storeId: string; storeName: string; avgPrice: number }[] }[] = [];
    productStoreMap.forEach((storeMap, pid) => {
      if (storeMap.size < 2) return;
      const storeEntries = Array.from(storeMap.entries()).map(([sid, { total, count }]) => ({
        storeId: sid,
        storeName: getStoreName(sid),
        avgPrice: Math.round((total / count) * 100) / 100,
      }));
      result.push({ productId: pid, name: getProductName(pid), stores: storeEntries.sort((a, b) => a.avgPrice - b.avgPrice) });
    });
    return result.slice(0, 10);
  }, [filteredHistory, products, stores]);

  const getPriceTrend = (pid: string) => {
    const records = history.filter(r => r.productId === pid).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (records.length < 2) return null;
    const last = records[records.length - 1];
    const prev = records[records.length - 2];
    const lastPrice = last.price * (1 - last.discount / 100);
    const prevPrice = prev.price * (1 - prev.discount / 100);
    const change = ((lastPrice - prevPrice) / prevPrice) * 100;
    return { change: Math.round(change * 10) / 10, direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable' as const };
  };

  const totalSpent = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  const noData = history.length === 0 && purchases.length === 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-4">{t('statistics')}</h1>

      {/* Period filter - first row */}
      <div className="flex gap-2 mb-3">
        {(['week', 'month', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            {t(p === 'all' ? 'allTime' : p)}
          </button>
        ))}
      </div>

      {/* Store filter - second row */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        <Store size={14} className="text-muted-foreground shrink-0 mt-1" />
        <button
          onClick={() => setFilterStore(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filterStore ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
        >
          {t('all')}
        </button>
        {stores.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterStore(s.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStore === s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {noData ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-lg font-semibold text-foreground mb-1">{t('noData')}</h2>
          <p className="text-sm text-muted-foreground">Ολοκλήρωσε αγορές για να δεις στατιστικά!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">{t('totalSpending')}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatPrice(totalSpent)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">{t('purchaseHistory')}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{filteredPurchases.length}</p>
            </div>
          </div>

          {monthlySpending.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">{t('monthlySpending')}</h2>
              <div className="p-3 rounded-2xl bg-card border border-border">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                      formatter={(value: number) => [formatPrice(value), t('total')]}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {categorySpending.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">{t('byCategory')}</h2>
              <div className="p-3 rounded-2xl bg-card border border-border">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categorySpending} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {categorySpending.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                      formatter={(value: number) => [formatPrice(value)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categorySpending.map((c, i) => (
                    <span key={c.category} className="text-[10px] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {c.name} ({formatPrice(c.value)})
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {topProducts.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">{t('topProducts')}</h2>
              <div className="space-y-1.5">
                {topProducts.map((p, i) => {
                  const trend = getPriceTrend(p.pid);
                  return (
                    <div key={p.pid} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                      <span className="w-6 text-center text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.count}×</span>
                      {trend && (
                        <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
                          trend.direction === 'up' ? 'text-destructive' :
                          trend.direction === 'down' ? 'text-primary' :
                          'text-muted-foreground'
                        }`}>
                          {trend.direction === 'up' && <TrendingUp size={12} />}
                          {trend.direction === 'down' && <TrendingDown size={12} />}
                          {trend.direction === 'stable' && <Minus size={12} />}
                          {trend.change > 0 ? '+' : ''}{trend.change}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {storeComparison.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">{t('storeComparison')}</h2>
              <div className="space-y-2">
                {storeComparison.map(item => (
                  <div key={item.productId} className="p-3 rounded-xl bg-card border border-border">
                    <p className="text-sm font-medium text-foreground mb-2">{item.name}</p>
                    <div className="flex gap-2 flex-wrap">
                      {item.stores.map((s, i) => (
                        <span
                          key={s.storeId}
                          className={`text-xs px-2 py-1 rounded-lg ${i === 0 ? 'bg-primary/10 text-primary font-medium' : 'bg-secondary text-secondary-foreground'}`}
                        >
                          {s.storeName}: {formatPrice(s.avgPrice)}
                          {i === 0 && ' ✓'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
