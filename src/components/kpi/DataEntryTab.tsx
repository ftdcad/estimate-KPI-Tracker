import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useEstimatorContext } from '@/contexts/EstimatorContext';
import { PERIL_OPTIONS } from '@/types/kpi';
import { SELECTABLE_STATUSES, STATUS_LABELS, STATUS_COLORS, ALLOWED_TRANSITIONS, canTransition, type EstimateStatus } from '@/lib/status';
import type { Estimate } from '@/types/estimate';
import BlockerDialog from './BlockerDialog';
import UnblockDialog from './UnblockDialog';
import EstimateDetailPanel from './EstimateDetailPanel';
import type { BlockerType } from '@/lib/status';

interface DataEntryTabProps {
  estimatorId: string;
  estimatorName: string;
}

const DataEntryTab: React.FC<DataEntryTabProps> = ({ estimatorId, estimatorName }) => {
  const { estimates, carriers, addEstimate, editEstimate, removeEstimate, blockEstimate, unblockEstimate, updateStatus, saveCarrier } = useEstimatorContext();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Blocker dialog state
  const [blockerTarget, setBlockerTarget] = useState<Estimate | null>(null);
  const [unblockerTarget, setUnblockerTarget] = useState<Estimate | null>(null);

  // Detail panel state
  const [detailEstimate, setDetailEstimate] = useState<Estimate | null>(null);
  const [createMode, setCreateMode] = useState(false);

  // Date range filter
  type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'custom' | 'all';
  const [datePreset, setDatePreset] = useState<DatePreset>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const getDateRangeStart = (preset: DatePreset): Date | null => {
    const now = new Date();
    switch (preset) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const w = new Date(now);
        w.setDate(w.getDate() - 7);
        return w;
      case 'month':
        const m = new Date(now);
        m.setDate(m.getDate() - 30);
        return m;
      case 'quarter':
        const q = new Date(now);
        q.setDate(q.getDate() - 90);
        return q;
      case 'all':
        return null;
      case 'custom':
        return customFrom ? new Date(customFrom) : null;
      default:
        return null;
    }
  };

  const getDateRangeEnd = (): Date | null => {
    if (datePreset === 'custom' && customTo) {
      const end = new Date(customTo);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    return null;
  };

  // Filter estimates for this estimator + date range
  const allEstimatorEstimates = estimates.filter((e) => e.estimator_id === estimatorId);
  const myEstimates = allEstimatorEstimates.filter((e) => {
    const received = new Date(e.date_received);
    const start = getDateRangeStart(datePreset);
    const end = getDateRangeEnd();
    if (start && received < start) return false;
    if (end && received > end) return false;
    return true;
  });

  // ── Helpers ────────────────────────────────────────────────

  const getTodayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatCurrency = (value: number | null): string => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const getEditValue = (id: string, field: string, fallback: string) => {
    const key = `${id}_${field}`;
    return key in editingValues ? editingValues[key] : fallback;
  };

  const setEditValue = (id: string, field: string, value: string) => {
    setEditingValues((prev) => ({ ...prev, [`${id}_${field}`]: value }));
  };

  const clearEditValue = (id: string, field: string) => {
    setEditingValues((prev) => {
      const next = { ...prev };
      delete next[`${id}_${field}`];
      return next;
    });
  };

  // ── Row color logic ────────────────────────────────────────

  const getRowClass = (est: Estimate): string => {
    if (est.status === 'blocked' && est.current_blocked_at) {
      const hours = (Date.now() - new Date(est.current_blocked_at).getTime()) / 3600000;
      if (hours > 48) return 'border-l-4 border-l-red-500 bg-red-500/5';
      return 'border-l-4 border-l-amber-500 bg-amber-500/5';
    }
    if (est.sla_breached) return 'bg-red-500/5';
    return '';
  };

  const getBlockedBadge = (est: Estimate): string | null => {
    if (est.status !== 'blocked' || !est.current_blocked_at) return null;
    const hours = (Date.now() - new Date(est.current_blocked_at).getTime()) / 3600000;
    const days = Math.floor(hours / 24);
    if (days > 0) return `BLOCKED ${days}d`;
    return `BLOCKED ${Math.floor(hours)}h`;
  };

  // ── CRUD ───────────────────────────────────────────────────

  const handleAddRow = () => {
    setCreateMode(true);
  };

  const handleFieldBlur = async (est: Estimate, field: keyof Estimate, rawValue: string) => {
    const key = `${est.id}_${field}`;
    clearEditValue(est.id, field);

    let value: any = rawValue;

    // Parse numbers
    if (['estimate_value', 'active_time_minutes', 'revision_time_minutes', 'revisions'].includes(field)) {
      const clean = rawValue.replace(/,/g, '');
      value = clean === '' ? null : parseFloat(clean);
      if (value !== null && isNaN(value)) return;

      // Convert hours input to minutes for time fields
      if (field === 'active_time_minutes' && value !== null) {
        value = Math.round(value * 60);
      }
      if (field === 'revision_time_minutes' && value !== null) {
        value = Math.round(value * 60);
      }
    }

    // Skip if unchanged
    if (est[field] === value) return;
    if (est[field] === null && (value === '' || value === null)) return;

    try {
      const updates: Partial<Estimate> = { [field]: value || null };

      // If carrier changed and non-empty, ensure it exists in reference table
      if (field === 'carrier' && value && typeof value === 'string' && value.trim()) {
        await saveCarrier(value.trim());
      }

      // Update total_time_minutes when active or blocked time changes
      if (field === 'active_time_minutes') {
        updates.total_time_minutes = (value || 0) + (est.blocked_time_minutes || 0);
      }

      await editEstimate(est.id, updates);
    } catch (err: any) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
  };

  const handleSelectChange = async (est: Estimate, field: keyof Estimate, value: string) => {
    const parsed = field === 'severity' ? (value ? parseInt(value) : null) : (value === '__none__' ? null : value);

    try {
      // If changing status, use the status change function for proper event logging
      if (field === 'status' && parsed && typeof parsed === 'string') {
        const newStatus = parsed as EstimateStatus;
        if (!canTransition(est.status, newStatus)) {
          toast({
            title: 'Invalid transition',
            description: `Cannot go from "${STATUS_LABELS[est.status]}" to "${STATUS_LABELS[newStatus]}"`,
            variant: 'destructive',
          });
          return;
        }
        await updateStatus(est.id, est.status, newStatus);
      } else {
        await editEstimate(est.id, { [field]: parsed } as any);
      }
    } catch (err: any) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    try {
      for (const id of selectedRows) {
        await removeEstimate(id);
      }
      setSelectedRows(new Set());
      toast({ title: `Deleted ${selectedRows.size} row(s)` });
    } catch (err: any) {
      toast({ title: 'Error deleting', description: err.message, variant: 'destructive' });
    }
  };

  // ── Blocker handlers ───────────────────────────────────────

  const handleBlockConfirm = async (blockerType: BlockerType, blockerName: string, blockerReason: string) => {
    if (!blockerTarget) return;
    try {
      await blockEstimate(blockerTarget.id, blockerType, blockerName, blockerReason);
      toast({ title: 'File marked as blocked' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setBlockerTarget(null);
  };

  const handleUnblockConfirm = async (resolutionNote: string) => {
    if (!unblockerTarget) return;
    try {
      await unblockEstimate(unblockerTarget.id, resolutionNote);
      toast({ title: 'Blocker resolved' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setUnblockerTarget(null);
  };

  // ── Toggle row selection ───────────────────────────────────

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Available statuses for dropdown (based on current status) ─

  const getAvailableStatuses = (current: EstimateStatus): EstimateStatus[] => {
    return ALLOWED_TRANSITIONS[current] || [];
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center justify-between">
            <span>{estimatorName} — Active Estimates</span>
            <span className="text-sm font-normal text-muted-foreground">
              {myEstimates.length} of {allEstimatorEstimates.length} file{allEstimatorEstimates.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {([
              ['today', 'Today'],
              ['week', 'Past Week'],
              ['month', 'Past Month'],
              ['quarter', 'Past Quarter'],
              ['all', 'All Time'],
              ['custom', 'Custom'],
            ] as [DatePreset, string][]).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={datePreset === key ? 'default' : 'outline'}
                className={cn('h-7 text-xs', datePreset === key && 'bg-primary text-primary-foreground')}
                onClick={() => setDatePreset(key)}
              >
                {label}
              </Button>
            ))}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 ml-2">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-7 w-36 text-xs"
                  placeholder="From"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-7 w-36 text-xs"
                  placeholder="To"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-2 w-8"></th>
                  <th className="border border-border p-2 w-[100px]">File #</th>
                  <th className="border border-border p-2">Client</th>
                  <th className="border border-border p-2">Ref. Source</th>
                  <th className="border border-border p-2">Ref. Source Rep</th>
                  <th className="border border-border p-2 w-[120px]">Carrier</th>
                  <th className="border border-border p-2 w-[100px]">Peril</th>
                  <th className="border border-border p-2 w-[60px]">Sev</th>
                  <th className="border border-border p-2 w-[70px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>Hours</TooltipTrigger>
                        <TooltipContent>
                          <p>Active work hours (0.25 = 15min)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="border border-border p-2 w-[100px]">Est. Value</th>
                  <th className="border border-border p-2 w-[60px]">Rev</th>
                  <th className="border border-border p-2 w-[120px]">Status</th>
                  <th className="border border-border p-2 w-[100px]">Blocker</th>
                  <th className="border border-border p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {myEstimates.map((est) => {
                  const blockedBadge = getBlockedBadge(est);
                  return (
                    <tr key={est.id} className={cn('hover:bg-accent/20', getRowClass(est))}>
                      {/* Checkbox */}
                      <td className="border border-border p-1 text-center">
                        <Checkbox
                          checked={selectedRows.has(est.id)}
                          onCheckedChange={() => toggleRow(est.id)}
                        />
                      </td>

                      {/* File Number */}
                      <td className="border border-border p-1">
                        <Input
                          value={getEditValue(est.id, 'file_number', est.file_number)}
                          onChange={(e) => setEditValue(est.id, 'file_number', e.target.value)}
                          onBlur={(e) => handleFieldBlur(est, 'file_number', e.target.value)}
                          className="border-0 h-8"
                          placeholder="File #"
                        />
                      </td>

                      {/* Client Name (clickable → opens detail panel) */}
                      <td
                        className="border border-border p-1 cursor-pointer hover:bg-accent/30"
                        onClick={() => setDetailEstimate(est)}
                      >
                        <span className="text-sm px-2 py-1 block truncate hover:underline">
                          {est.client_name || <span className="text-muted-foreground italic">No name</span>}
                        </span>
                      </td>

                      {/* Referral Source */}
                      <td className="border border-border p-1">
                        <Input
                          value={getEditValue(est.id, 'referral_source', est.referral_source)}
                          onChange={(e) => setEditValue(est.id, 'referral_source', e.target.value)}
                          onBlur={(e) => handleFieldBlur(est, 'referral_source', e.target.value)}
                          className="border-0 h-8"
                          placeholder="Referral source"
                        />
                      </td>

                      {/* Referral Source Rep */}
                      <td className="border border-border p-1">
                        <Input
                          value={getEditValue(est.id, 'referral_source_rep', est.referral_source_rep)}
                          onChange={(e) => setEditValue(est.id, 'referral_source_rep', e.target.value)}
                          onBlur={(e) => handleFieldBlur(est, 'referral_source_rep', e.target.value)}
                          className="border-0 h-8"
                          placeholder="Rep name"
                        />
                      </td>

                      {/* Carrier (optional, auto-suggest from reference data) */}
                      <td className="border border-border p-1">
                        <Input
                          value={getEditValue(est.id, 'carrier', est.carrier)}
                          onChange={(e) => setEditValue(est.id, 'carrier', e.target.value)}
                          onBlur={(e) => handleFieldBlur(est, 'carrier', e.target.value)}
                          className="border-0 h-8"
                          placeholder="Carrier"
                          list={`carriers-${est.id}`}
                        />
                        <datalist id={`carriers-${est.id}`}>
                          {carriers.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </td>

                      {/* Peril */}
                      <td className="border border-border p-1">
                        <Select
                          value={est.peril || '__none__'}
                          onValueChange={(v) => handleSelectChange(est, 'peril', v)}
                        >
                          <SelectTrigger className="border-0 h-8">
                            <SelectValue placeholder="Peril" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">--</SelectItem>
                            {PERIL_OPTIONS.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Severity */}
                      <td className="border border-border p-1">
                        <Select
                          value={est.severity?.toString() || ''}
                          onValueChange={(v) => handleSelectChange(est, 'severity', v)}
                        >
                          <SelectTrigger className="border-0 h-8">
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Hours (input as decimal hours → stored as active_time_minutes) */}
                      <td className="border border-border p-1">
                        <Input
                          type="text"
                          value={getEditValue(est.id, 'hours', est.active_time_minutes > 0 ? (est.active_time_minutes / 60).toString() : '')}
                          onChange={(e) => setEditValue(est.id, 'hours', e.target.value)}
                          onBlur={(e) => handleFieldBlur(est, 'active_time_minutes', e.target.value)}
                          className="border-0 h-8 text-right"
                          placeholder="0.25"
                        />
                      </td>

                      {/* Estimate Value */}
                      <td className="border border-border p-1">
                        <Input
                          type="text"
                          value={
                            `${est.id}_estimate_value` in editingValues
                              ? editingValues[`${est.id}_estimate_value`]
                              : (est.estimate_value ? formatCurrency(est.estimate_value) : '')
                          }
                          onFocus={() => setEditValue(est.id, 'estimate_value', est.estimate_value?.toString() ?? '')}
                          onChange={(e) => setEditValue(est.id, 'estimate_value', e.target.value)}
                          onBlur={(e) => handleFieldBlur(est, 'estimate_value', e.target.value)}
                          className="border-0 h-8 text-right"
                          placeholder="0.00"
                        />
                      </td>

                      {/* Revisions */}
                      <td className="border border-border p-1">
                        <Input
                          type="text"
                          value={getEditValue(est.id, 'revisions', est.revisions?.toString() ?? '')}
                          onChange={(e) => setEditValue(est.id, 'revisions', e.target.value)}
                          onBlur={(e) => handleFieldBlur(est, 'revisions', e.target.value)}
                          className="border-0 h-8 text-right w-14"
                          placeholder="0"
                        />
                      </td>

                      {/* Status dropdown */}
                      <td className="border border-border p-1">
                        <div className="flex items-center gap-1">
                          <span className={cn('text-xs px-1.5 py-0.5 rounded border', STATUS_COLORS[est.status])}>
                            {STATUS_LABELS[est.status]}
                          </span>
                          {est.status !== 'closed' && est.status !== 'blocked' && (
                            <Select
                              value=""
                              onValueChange={(v) => handleSelectChange(est, 'status', v)}
                            >
                              <SelectTrigger className="border-0 h-6 w-8 p-0">
                                <span className="text-muted-foreground text-xs">...</span>
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableStatuses(est.status).filter(s => s !== 'blocked').map((s) => (
                                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        {blockedBadge && (
                          <span className="text-[10px] font-bold text-amber-400 mt-0.5 block">
                            {blockedBadge}
                          </span>
                        )}
                      </td>

                      {/* Blocker button */}
                      <td className="border border-border p-1 text-center">
                        {est.status === 'in-progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/40"
                            onClick={() => setBlockerTarget(est)}
                          >
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Blocked
                          </Button>
                        )}
                        {est.status === 'blocked' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-green-600/20 text-green-300 border-green-500/40 hover:bg-green-600/40"
                            onClick={() => setUnblockerTarget(est)}
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Unblocked
                          </Button>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="border border-border p-1">
                        <Input
                          value={getEditValue(est.id, 'notes', est.notes)}
                          onChange={(e) => setEditValue(est.id, 'notes', e.target.value)}
                          onBlur={(e) => handleFieldBlur(est, 'notes', e.target.value)}
                          className="border-0 h-8"
                          placeholder="Notes..."
                        />
                      </td>
                    </tr>
                  );
                })}

                {myEstimates.length === 0 && (
                  <tr>
                    <td colSpan={14} className="border border-border p-8 text-center text-muted-foreground">
                      No estimates yet. Click "Add Row" to enter your first estimate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddRow} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            <Button
              onClick={handleDeleteSelected}
              variant="outline"
              size="sm"
              disabled={selectedRows.size === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocker Dialog */}
      <BlockerDialog
        open={!!blockerTarget}
        onClose={() => setBlockerTarget(null)}
        onConfirm={handleBlockConfirm}
        fileNumber={blockerTarget?.file_number || ''}
      />

      {/* Unblock Dialog */}
      <UnblockDialog
        open={!!unblockerTarget}
        onClose={() => setUnblockerTarget(null)}
        onConfirm={handleUnblockConfirm}
        fileNumber={unblockerTarget?.file_number || ''}
        blockerType={unblockerTarget?.current_blocker_type || ''}
        blockerReason={unblockerTarget?.current_blocker_reason || ''}
        blockedAt={unblockerTarget?.current_blocked_at || null}
      />

      {/* Estimate Detail Panel (slide-out sheet) */}
      <EstimateDetailPanel
        estimate={detailEstimate}
        createMode={createMode}
        estimatorId={estimatorId}
        estimatorName={estimatorName}
        onClose={() => {
          setDetailEstimate(null);
          setCreateMode(false);
        }}
        onCreated={(newEstimate) => {
          // Switch from create mode to edit mode for the new estimate
          setCreateMode(false);
          setDetailEstimate(newEstimate);
        }}
      />
    </>
  );
};

export default DataEntryTab;
