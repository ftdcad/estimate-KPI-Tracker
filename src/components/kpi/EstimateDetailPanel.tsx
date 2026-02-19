import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ShieldAlert, ShieldCheck, Save, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useEstimatorContext } from '@/contexts/EstimatorContext';
import { STATUS_LABELS, STATUS_COLORS, SELECTABLE_STATUSES, ALLOWED_TRANSITIONS, canTransition } from '@/lib/status';
import type { EstimateStatus, BlockerType } from '@/lib/status';
import { PERIL_OPTIONS } from '@/types/kpi';
import type { Estimate } from '@/types/estimate';
import { searchClientNames, type ClientSuggestion } from '@/lib/supabase-queries';
import CollapsibleSection from './CollapsibleSection';
import BlockerDialog from './BlockerDialog';
import UnblockDialog from './UnblockDialog';
import CrmParseDialog from './CrmParseDialog';
import type { ParsedCrmData } from '@/lib/crm-parser';

// ── Types ────────────────────────────────────────────────────────

interface EstimateDetailPanelProps {
  /** Existing estimate for edit mode, null for create mode */
  estimate: Estimate | null;
  /** True when opening a blank panel from "Add Row" */
  createMode: boolean;
  /** Estimator info for new estimates */
  estimatorId: string;
  estimatorName: string;
  onClose: () => void;
  /** Called after successful create so parent can switch to edit mode */
  onCreated?: (newEstimate: Estimate) => void;
}

type FormValues = Partial<Estimate>;

// ── US States ────────────────────────────────────────────────────

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

// ── Component ────────────────────────────────────────────────────

const EstimateDetailPanel: React.FC<EstimateDetailPanelProps> = ({
  estimate,
  createMode,
  estimatorId,
  estimatorName,
  onClose,
  onCreated,
}) => {
  const { addEstimate, editEstimate, carriers, blockEstimate, unblockEstimate, updateStatus, saveCarrier } = useEstimatorContext();
  const open = !!estimate || createMode;

  // ── Create mode local state ──────────────────────────────────
  const [formValues, setFormValues] = useState<FormValues>({});
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Client autocomplete state ────────────────────────────────
  const [clientSearch, setClientSearch] = useState('');
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // ── Blocker dialog state ─────────────────────────────────────
  const [blockerOpen, setBlockerOpen] = useState(false);
  const [unblockerOpen, setUnblockerOpen] = useState(false);

  // ── CRM parse dialog state ──────────────────────────────────
  const [crmDialogOpen, setCrmDialogOpen] = useState(false);

  // Reset form when panel opens/closes or switches estimates
  useEffect(() => {
    if (createMode) {
      setFormValues({
        estimator_id: estimatorId,
        estimator_name: estimatorName,
        status: 'assigned',
        date_received: new Date().toISOString().split('T')[0],
      });
      setPrefilledFrom(null);
      setClientSearch('');
    } else {
      setFormValues({});
      setPrefilledFrom(null);
      setClientSearch('');
    }
  }, [createMode, estimate?.id, estimatorId, estimatorName]);

  // ── Helpers ──────────────────────────────────────────────────

  /** Get the display value — form state in create mode, estimate field in edit mode */
  const getValue = useCallback((field: keyof Estimate): any => {
    if (createMode) {
      return formValues[field] ?? '';
    }
    return estimate?.[field] ?? '';
  }, [createMode, formValues, estimate]);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  // ── Create mode: update local form ───────────────────────────

  const setField = (field: keyof Estimate, value: any) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  // ── Edit mode: blur-save ─────────────────────────────────────

  const handleBlurSave = async (field: keyof Estimate, rawValue: string) => {
    if (!estimate || createMode) return;

    let value: any = rawValue;

    // Parse numbers
    const numberFields = ['estimate_value', 'rcv', 'acv', 'depreciation', 'deductible', 'net_claim', 'overhead_and_profit', 'active_time_minutes', 'revision_time_minutes', 'revisions', 'severity'];
    if (numberFields.includes(field)) {
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
    if (estimate[field] === value) return;
    if (estimate[field] === null && (value === '' || value === null)) return;

    try {
      const updates: Partial<Estimate> = { [field]: value === '' ? null : value };

      if (field === 'carrier' && value && typeof value === 'string' && value.trim()) {
        await saveCarrier(value.trim());
      }

      if (field === 'active_time_minutes') {
        updates.total_time_minutes = (value || 0) + (estimate.blocked_time_minutes || 0);
      }

      await editEstimate(estimate.id, updates);
    } catch (err: any) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
  };

  const handleSelectSave = async (field: keyof Estimate, value: string) => {
    if (createMode) {
      setField(field, value === '__none__' ? null : value);
      return;
    }
    if (!estimate) return;

    const parsed = field === 'severity' ? (value ? parseInt(value) : null) : (value === '__none__' ? null : value);

    try {
      if (field === 'status' && parsed && typeof parsed === 'string') {
        const newStatus = parsed as EstimateStatus;
        if (!canTransition(estimate.status, newStatus)) {
          toast({
            title: 'Invalid transition',
            description: `Cannot go from "${STATUS_LABELS[estimate.status]}" to "${STATUS_LABELS[newStatus]}"`,
            variant: 'destructive',
          });
          return;
        }
        await updateStatus(estimate.id, estimate.status, newStatus);
      } else {
        await editEstimate(estimate.id, { [field]: parsed } as any);
      }
    } catch (err: any) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
  };

  // ── Client name autocomplete ─────────────────────────────────

  const handleClientSearch = (value: string) => {
    setClientSearch(value);

    if (createMode) {
      setField('client_name', value);
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.length < 3) {
      setSuggestions([]);
      setPopoverOpen(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchClientNames(value);
        setSuggestions(results);
        setPopoverOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: ClientSuggestion) => {
    const prefill = {
      client_name: suggestion.client_name,
      carrier: suggestion.carrier,
      referral_source: suggestion.referral_source,
      referral_source_rep: suggestion.referral_source_rep,
      loss_state: suggestion.loss_state,
      property_type: suggestion.property_type,
      contractor_company: suggestion.contractor_company,
      contractor_rep: suggestion.contractor_rep,
      contractor_rep_email: suggestion.contractor_rep_email,
      contractor_rep_phone: suggestion.contractor_rep_phone,
    };

    if (createMode) {
      setFormValues(prev => ({ ...prev, ...prefill }));
    } else if (estimate) {
      // In edit mode, apply all pre-filled fields via editEstimate
      editEstimate(estimate.id, prefill as Partial<Estimate>).catch((err: any) => {
        toast({ title: 'Error applying suggestion', description: err.message, variant: 'destructive' });
      });
    }

    setClientSearch(suggestion.client_name);
    const date = new Date(suggestion.date_received).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    setPrefilledFrom(`Pre-filled from ${suggestion.client_name} (Est #${suggestion.file_number}, ${date})`);
    setPopoverOpen(false);
  };

  // ── Create estimate ──────────────────────────────────────────

  const handleCreate = async () => {
    if (!formValues.client_name?.trim()) {
      toast({ title: 'Client name required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Build the insert payload
      const payload: Partial<Estimate> = {
        file_number: formValues.file_number || '',
        client_name: formValues.client_name.trim(),
        estimator_id: estimatorId,
        estimator_name: estimatorName,
        status: 'assigned' as EstimateStatus,
        date_received: formValues.date_received ? new Date(formValues.date_received).toISOString() : new Date().toISOString(),
        peril: (formValues.peril as any) || null,
        severity: formValues.severity ? Number(formValues.severity) : null,
        estimate_value: formValues.estimate_value ? Number(formValues.estimate_value) : null,
        carrier: formValues.carrier || '',
        notes: formValues.notes || '',
        revisions: 0,
        is_settled: false,
        actual_settlement: null,
        settlement_date: null,
        claim_number: formValues.claim_number || '',
        policy_number: formValues.policy_number || '',
        loss_state: formValues.loss_state || '',
        loss_date: formValues.loss_date || null,
        carrier_adjuster: formValues.carrier_adjuster || '',
        carrier_adjuster_email: formValues.carrier_adjuster_email || '',
        carrier_adjuster_phone: formValues.carrier_adjuster_phone || '',
        contractor_company: formValues.contractor_company || '',
        contractor_rep: formValues.contractor_rep || '',
        contractor_rep_email: formValues.contractor_rep_email || '',
        contractor_rep_phone: formValues.contractor_rep_phone || '',
        public_adjuster: formValues.public_adjuster || '',
        referral_source: formValues.referral_source || '',
        referral_source_rep: formValues.referral_source_rep || '',
        rcv: formValues.rcv ? Number(formValues.rcv) : null,
        acv: formValues.acv ? Number(formValues.acv) : null,
        depreciation: formValues.depreciation ? Number(formValues.depreciation) : null,
        deductible: formValues.deductible ? Number(formValues.deductible) : null,
        net_claim: formValues.net_claim ? Number(formValues.net_claim) : null,
        overhead_and_profit: formValues.overhead_and_profit ? Number(formValues.overhead_and_profit) : null,
        property_type: formValues.property_type || null,
        sla_target_hours: null,
      };

      if (formValues.carrier && formValues.carrier.trim()) {
        await saveCarrier(formValues.carrier.trim());
      }

      const created = await addEstimate(payload);
      toast({ title: 'Estimate created' });
      onCreated?.(created);
    } catch (err: any) {
      toast({ title: 'Error creating estimate', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Blocker handlers ─────────────────────────────────────────

  const currentEstimate = estimate;

  const handleBlockConfirm = async (blockerType: BlockerType, blockerName: string, blockerReason: string) => {
    if (!currentEstimate) return;
    try {
      await blockEstimate(currentEstimate.id, blockerType, blockerName, blockerReason);
      toast({ title: 'File marked as blocked' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setBlockerOpen(false);
  };

  const handleUnblockConfirm = async (resolutionNote: string) => {
    if (!currentEstimate) return;
    try {
      await unblockEstimate(currentEstimate.id, resolutionNote);
      toast({ title: 'Blocker resolved' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setUnblockerOpen(false);
  };

  // ── CRM data apply ────────────────────────────────────────────

  const handleCrmApply = async (data: ParsedCrmData) => {
    const updates: Partial<Estimate> = {};
    if (data.file_number) updates.file_number = data.file_number;
    if (data.client_name) updates.client_name = data.client_name;
    if (data.loss_state) updates.loss_state = data.loss_state;
    if (data.loss_date) updates.loss_date = data.loss_date;
    if (data.peril) updates.peril = data.peril;
    if (data.carrier) updates.carrier = data.carrier;
    if (data.claim_number) updates.claim_number = data.claim_number;
    if (data.policy_number) updates.policy_number = data.policy_number;
    if (data.property_type) updates.property_type = data.property_type;
    if (data.severity) updates.severity = data.severity;
    if (data.contractor_company) updates.contractor_company = data.contractor_company;
    if (data.contractor_rep) updates.contractor_rep = data.contractor_rep;
    if (data.contractor_rep_email) updates.contractor_rep_email = data.contractor_rep_email;
    if (data.referral_source) updates.referral_source = data.referral_source;
    if (data.estimate_value) updates.estimate_value = data.estimate_value;
    if (data.description_of_loss) updates.notes = data.description_of_loss;

    if (createMode) {
      setFormValues(prev => ({ ...prev, ...updates }));
      if (data.client_name) setClientSearch(data.client_name);
      toast({ title: `Filled ${Object.keys(updates).length} fields from ClaimWizard` });
    } else if (estimate) {
      try {
        if (data.carrier && data.carrier.trim()) {
          await saveCarrier(data.carrier.trim());
        }
        await editEstimate(estimate.id, updates);
        toast({ title: `Updated ${Object.keys(updates).length} fields from ClaimWizard` });
      } catch (err: any) {
        toast({ title: 'Error applying CRM data', description: err.message, variant: 'destructive' });
      }
    }
  };

  // ── Reusable field components ────────────────────────────────

  const TextField = ({ label, field, placeholder }: { label: string; field: keyof Estimate; placeholder?: string }) => {
    const val = getValue(field);
    return (
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <Input
          value={createMode ? (val?.toString() ?? '') : undefined}
          defaultValue={!createMode ? (val?.toString() ?? '') : undefined}
          onChange={createMode ? (e) => setField(field, e.target.value) : undefined}
          onBlur={!createMode ? (e) => handleBlurSave(field, e.target.value) : undefined}
          className="h-8 text-sm"
          placeholder={placeholder}
        />
      </div>
    );
  };

  const CurrencyField = ({ label, field, placeholder }: { label: string; field: keyof Estimate; placeholder?: string }) => {
    const val = getValue(field);
    const display = createMode
      ? (val?.toString() ?? '')
      : (typeof val === 'number' ? formatCurrency(val) : '');
    return (
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <Input
          value={createMode ? (val?.toString() ?? '') : undefined}
          defaultValue={!createMode ? display : undefined}
          onChange={createMode ? (e) => setField(field, e.target.value) : undefined}
          onBlur={!createMode ? (e) => handleBlurSave(field, e.target.value) : undefined}
          className="h-8 text-sm text-right"
          placeholder={placeholder || '0.00'}
        />
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────

  const status = (createMode ? formValues.status : estimate?.status) as EstimateStatus | undefined;
  const statusLabel = status ? STATUS_LABELS[status] : 'Unknown';
  const statusColor = status ? STATUS_COLORS[status] : '';

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <SheetContent
          side="right"
          className="w-[55vw] max-w-none sm:max-w-none overflow-y-auto bg-background border-l border-border p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-lg">
                  {createMode ? 'New Estimate' : `Estimate — ${estimate?.client_name || 'Details'}`}
                </SheetTitle>
                <SheetDescription>
                  {createMode
                    ? 'Fill in the details below and click "Create Estimate" to save.'
                    : 'Click any field to edit. Changes save automatically on blur.'}
                </SheetDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 mr-8"
                onClick={() => setCrmDialogOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Assist
              </Button>
            </div>
          </SheetHeader>

          <div className="px-6 py-4 space-y-3">

            {/* ── Section 1: Header ──────────────────────────── */}
            <CollapsibleSection title="Header" defaultOpen>
              <div className="grid grid-cols-4 gap-3">
                <TextField label="File #" field="file_number" placeholder="EST-001" />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Status</label>
                  {createMode ? (
                    <span className={cn('text-xs px-2 py-1 rounded border inline-block', STATUS_COLORS['assigned'])}>
                      Assigned
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs px-2 py-1 rounded border', statusColor)}>
                        {statusLabel}
                      </span>
                      {status && status !== 'closed' && status !== 'blocked' && (
                        <Select value="" onValueChange={(v) => handleSelectSave('status', v)}>
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <span className="text-muted-foreground">Move...</span>
                          </SelectTrigger>
                          <SelectContent>
                            {(ALLOWED_TRANSITIONS[status] || []).filter(s => s !== 'blocked').map((s) => (
                              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Severity</label>
                  <Select
                    value={(getValue('severity')?.toString()) || ''}
                    onValueChange={(v) => handleSelectSave('severity', v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="1-5" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Date Received</label>
                  <Input
                    type="date"
                    value={createMode ? (formValues.date_received?.split('T')[0] ?? '') : undefined}
                    defaultValue={!createMode ? (estimate?.date_received?.split('T')[0] ?? '') : undefined}
                    onChange={createMode ? (e) => setField('date_received', e.target.value) : undefined}
                    onBlur={!createMode ? (e) => handleBlurSave('date_received', e.target.value ? new Date(e.target.value).toISOString() : '') : undefined}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* ── Section 2: Client Info ─────────────────────── */}
            <CollapsibleSection title="Client Info" defaultOpen>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Client Name</label>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Input
                        value={createMode ? (clientSearch || formValues.client_name?.toString() || '') : undefined}
                        defaultValue={!createMode ? (estimate?.client_name ?? '') : undefined}
                        onChange={(e) => handleClientSearch(e.target.value)}
                        onBlur={!createMode ? (e) => handleBlurSave('client_name', e.target.value) : undefined}
                        className="h-8 text-sm"
                        placeholder="Type client name..."
                      />
                    </PopoverTrigger>
                    {suggestions.length > 0 && (
                      <PopoverContent className="w-[400px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Command>
                          <CommandList>
                            <CommandEmpty>No matches</CommandEmpty>
                            <CommandGroup heading="Existing clients">
                              {suggestions.map((s) => {
                                const date = new Date(s.date_received).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                return (
                                  <CommandItem
                                    key={`${s.client_name}-${s.file_number}`}
                                    onSelect={() => handleSelectSuggestion(s)}
                                    className="cursor-pointer"
                                  >
                                    <div>
                                      <span className="font-medium">{s.client_name}</span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        #{s.file_number} &middot; {s.carrier || 'No carrier'} &middot; {date}
                                      </span>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    )}
                  </Popover>
                  {prefilledFrom && (
                    <p className="text-xs text-muted-foreground/70 italic mt-1">{prefilledFrom}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Property Type</label>
                    <Select
                      value={(getValue('property_type')?.toString()) || '__none__'}
                      onValueChange={(v) => handleSelectSave('property_type', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">--</SelectItem>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Loss State</label>
                    <Select
                      value={(getValue('loss_state')?.toString()) || '__none__'}
                      onValueChange={(v) => {
                        const val = v === '__none__' ? '' : v;
                        if (createMode) { setField('loss_state', val); }
                        else if (estimate) { editEstimate(estimate.id, { loss_state: val }); }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="State..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">--</SelectItem>
                        {US_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Loss Date</label>
                    <Input
                      type="date"
                      value={createMode ? (formValues.loss_date?.toString() ?? '') : undefined}
                      defaultValue={!createMode ? (estimate?.loss_date?.split('T')[0] ?? '') : undefined}
                      onChange={createMode ? (e) => setField('loss_date', e.target.value || null) : undefined}
                      onBlur={!createMode ? (e) => handleBlurSave('loss_date', e.target.value || '') : undefined}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Claim Number" field="claim_number" placeholder="CLM-..." />
                  <TextField label="Policy Number" field="policy_number" placeholder="POL-..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Peril</label>
                  <Select
                    value={(getValue('peril')?.toString()) || '__none__'}
                    onValueChange={(v) => handleSelectSave('peril', v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select peril..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">--</SelectItem>
                      {PERIL_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>

            {/* ── Section 3: Referral Source ─────────────────── */}
            <CollapsibleSection title="Referral Source">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Referral Source" field="referral_source" placeholder="Source name" />
                <TextField label="Rep Name" field="referral_source_rep" placeholder="Rep name" />
              </div>
            </CollapsibleSection>

            {/* ── Section 4: Carrier & Adjuster ─────────────── */}
            <CollapsibleSection title="Carrier & Adjuster">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Carrier</label>
                  <Input
                    value={createMode ? (formValues.carrier?.toString() ?? '') : undefined}
                    defaultValue={!createMode ? (estimate?.carrier ?? '') : undefined}
                    onChange={createMode ? (e) => setField('carrier', e.target.value) : undefined}
                    onBlur={!createMode ? (e) => handleBlurSave('carrier', e.target.value) : undefined}
                    className="h-8 text-sm"
                    placeholder="Carrier name"
                    list="panel-carriers"
                  />
                  <datalist id="panel-carriers">
                    {carriers.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TextField label="Adjuster Name" field="carrier_adjuster" placeholder="Name" />
                  <TextField label="Adjuster Email" field="carrier_adjuster_email" placeholder="email@..." />
                  <TextField label="Adjuster Phone" field="carrier_adjuster_phone" placeholder="(555) 555-5555" />
                </div>
              </div>
            </CollapsibleSection>

            {/* ── Section 5: Contractor ──────────────────────── */}
            <CollapsibleSection title="Contractor">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Company" field="contractor_company" placeholder="Company name" />
                <TextField label="Rep Name" field="contractor_rep" placeholder="Rep name" />
                <TextField label="Rep Email" field="contractor_rep_email" placeholder="email@..." />
                <TextField label="Rep Phone" field="contractor_rep_phone" placeholder="(555) 555-5555" />
              </div>
            </CollapsibleSection>

            {/* ── Section 6: Estimate Values ─────────────────── */}
            <CollapsibleSection title="Estimate Values">
              <div className="grid grid-cols-4 gap-3">
                <CurrencyField label="Estimate Value" field="estimate_value" />
                <CurrencyField label="RCV" field="rcv" />
                <CurrencyField label="ACV" field="acv" />
                <CurrencyField label="Depreciation" field="depreciation" />
                <CurrencyField label="Deductible" field="deductible" />
                <CurrencyField label="Net Claim" field="net_claim" />
                <CurrencyField label="O&P %" field="overhead_and_profit" placeholder="10" />
              </div>
            </CollapsibleSection>

            {/* ── Section 7: Time & Blocker ──────────────────── */}
            <CollapsibleSection title="Time & Blocker">
              {createMode ? (
                <p className="text-xs text-muted-foreground">Time tracking starts after the estimate is created.</p>
              ) : estimate ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Active Hours</label>
                      <Input
                        defaultValue={estimate.active_time_minutes > 0 ? (estimate.active_time_minutes / 60).toFixed(2) : ''}
                        onBlur={(e) => handleBlurSave('active_time_minutes', e.target.value)}
                        className="h-8 text-sm text-right"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Blocked Hours</label>
                      <div className="h-8 flex items-center text-sm text-muted-foreground px-3 bg-muted/30 rounded-md">
                        {estimate.blocked_time_minutes > 0 ? (estimate.blocked_time_minutes / 60).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Revisions</label>
                      <Input
                        defaultValue={estimate.revisions?.toString() ?? '0'}
                        onBlur={(e) => handleBlurSave('revisions', e.target.value)}
                        className="h-8 text-sm text-right"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {estimate.status === 'in-progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/40"
                        onClick={() => setBlockerOpen(true)}
                      >
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        Mark as Blocked
                      </Button>
                    )}
                    {estimate.status === 'blocked' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs bg-green-600/20 text-green-300 border-green-500/40 hover:bg-green-600/40"
                        onClick={() => setUnblockerOpen(true)}
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Resolve Blocker
                      </Button>
                    )}
                    {estimate.status === 'blocked' && estimate.current_blocked_at && (
                      <span className="text-xs text-amber-400 flex items-center">
                        Blocked {(() => {
                          const hours = (Date.now() - new Date(estimate.current_blocked_at).getTime()) / 3600000;
                          const days = Math.floor(hours / 24);
                          if (days > 0) return `${days}d ${Math.floor(hours % 24)}h`;
                          return `${Math.floor(hours)}h`;
                        })()}
                        {estimate.current_blocker_type && ` — ${estimate.current_blocker_type}`}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </CollapsibleSection>

            {/* ── Section 8: Notes ───────────────────────────── */}
            <CollapsibleSection title="Notes">
              <div className="space-y-1">
                <Textarea
                  value={createMode ? (formValues.notes?.toString() ?? '') : undefined}
                  defaultValue={!createMode ? (estimate?.notes ?? '') : undefined}
                  onChange={createMode ? (e) => setField('notes', e.target.value) : undefined}
                  onBlur={!createMode ? (e) => handleBlurSave('notes', (e.target as HTMLTextAreaElement).value) : undefined}
                  className="min-h-[100px] text-sm"
                  placeholder="Notes about this estimate..."
                />
              </div>
            </CollapsibleSection>

            {/* ── Create button (create mode only) ──────────── */}
            {createMode && (
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={handleCreate}
                  disabled={saving || !formValues.client_name?.trim()}
                  className="w-full h-10"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Creating...' : 'Create Estimate'}
                </Button>
              </div>
            )}

          </div>
        </SheetContent>
      </Sheet>

      {/* CRM Parse Dialog */}
      <CrmParseDialog
        open={crmDialogOpen}
        onClose={() => setCrmDialogOpen(false)}
        onApply={handleCrmApply}
      />

      {/* Blocker/Unblock dialogs — outside the Sheet so they stack properly */}
      <BlockerDialog
        open={blockerOpen}
        onClose={() => setBlockerOpen(false)}
        onConfirm={handleBlockConfirm}
        fileNumber={currentEstimate?.file_number || ''}
      />
      <UnblockDialog
        open={unblockerOpen}
        onClose={() => setUnblockerOpen(false)}
        onConfirm={handleUnblockConfirm}
        fileNumber={currentEstimate?.file_number || ''}
        blockerType={currentEstimate?.current_blocker_type || ''}
        blockerReason={currentEstimate?.current_blocker_reason || ''}
        blockedAt={currentEstimate?.current_blocked_at || null}
      />
    </>
  );
};

export default EstimateDetailPanel;
