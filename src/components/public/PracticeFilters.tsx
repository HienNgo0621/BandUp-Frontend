import { useState } from 'react';
import { Icon } from '../ui/Icon';
import type { PracticeFilterSet } from '../../data/practiceContent';

export interface PracticeFilterState {
  search: string;
  group: string;
  checked: Record<string, string[]>;
}

export function PracticeFilters({ definition, value, onChange, onCollapseChange }: { definition: PracticeFilterSet; value: PracticeFilterState; onChange: (next: PracticeFilterState) => void; onCollapseChange?: (collapsed: boolean) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const updateChecked = (label: string, option: string, selected: boolean, type: 'radio' | 'checkbox') => {
    const current = value.checked[label] ?? [];
    const next = type === 'radio' ? selected ? [option] : [] : selected ? [...current, option] : current.filter((item) => item !== option);
    onChange({ ...value, checked: { ...value.checked, [label]: next } });
  };

  return <aside className={`fa card p-4 w-full lg:w-64 shrink-0 self-start lg:sticky lg:top-4 ${collapsed ? 'fcl' : ''}`} aria-label="Practice filters">
    <div className="practice-filter-heading">
      <h2 className="font-bold"><Icon name="sliders" size={18} /> <span className="ftx">Filters</span></h2>
      <span className="practice-filter-actions"><button className="fclr" type="button" onClick={() => onChange({ search: '', group: 'All', checked: {} })}>Clear all</button><button className="filter-collapse" type="button" aria-expanded={!collapsed} aria-label={collapsed ? 'Expand filters' : 'Collapse filters'} onClick={() => setCollapsed((state) => { onCollapseChange?.(!state); return !state; })}><Icon name="chevron-down" size={16} /></button></span>
    </div>
    <div className="practice-filter-fields">
      <label className="practice-filter-search"><span>Search</span><input className="inp" value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder="Search title or question type" /></label>
      <fieldset className="fg"><legend>{definition.groupLabel}</legend>{['All', ...definition.groups].map((option) => <label key={option}><input type="radio" name="practice-group" value={option} checked={value.group === option} onChange={() => onChange({ ...value, group: option })} /><span>{option}</span></label>)}</fieldset>
      {definition.filters.map((filter) => <fieldset className="fg" key={filter.label}><legend>{filter.label}</legend>{filter.options.map((option) => <label key={option}><input type={filter.type} name={`practice-${filter.label}`} checked={(value.checked[filter.label] ?? []).includes(option)} onChange={(event) => updateChecked(filter.label, option, event.target.checked, filter.type)} /><span>{option}</span></label>)}</fieldset>)}
    </div>
  </aside>;
}
