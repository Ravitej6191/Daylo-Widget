import { useId, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useSettingsDraft } from '../../hooks/useSettingsDraft'
import { useTheme } from '../../hooks/useTheme'

const APP_VERSION = '0.1.0'

const CONTROL = 'rounded-md border px-2.5 py-1.5 text-[13px] transition-colors hover:bg-[var(--color-hover)]'
const CONTROL_STYLE = { borderColor: 'var(--color-border)', color: 'var(--color-text)' } as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </h2>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  )
}

interface Option<T extends string> {
  value: T
  label: string
}

function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string
  name: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1.5 py-1">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-2 text-[13px]">
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-3.5 w-3.5 cursor-pointer"
            style={{ accentColor: 'var(--color-accent)' }}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}

function CheckboxRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 px-1.5 py-1 text-[13px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 cursor-pointer"
        style={{ accentColor: 'var(--color-accent)' }}
      />
      {label}
    </label>
  )
}

export function SettingsApp() {
  const { draft, setField, apply, isDirty, ready, applyState } = useSettingsDraft()
  useTheme()
  const cookieId = useId()

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <Section title="Weather">
          <RadioGroup
            legend="Temperature unit"
            name="tempUnit"
            value={draft.temperatureUnit}
            onChange={(v) => setField('temperatureUnit', v)}
            options={[
              { value: 'celsius', label: 'Celsius' },
              { value: 'fahrenheit', label: 'Fahrenheit' },
            ]}
          />
        </Section>

        <Section title="Claude Usage">
          <CheckboxRow checked={draft.claudeEnabled} label="Show Claude usage" onChange={(v) => setField('claudeEnabled', v)} />
          {draft.claudeEnabled && (
            <div className="flex flex-col gap-3 px-1.5">
              <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                This stores your claude.ai session cookie on this PC and sends it to claude.ai to read your usage.
                It grants full access to your account — treat it like a password, and only use this on a computer
                you trust.
              </p>
              <div className="flex flex-col gap-1">
                <label htmlFor={cookieId} className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                  Cookie header
                </label>
                <textarea
                  id={cookieId}
                  value={draft.claudeCookie}
                  onChange={(e) => setField('claudeCookie', e.target.value)}
                  placeholder="Paste the full Cookie header value"
                  rows={3}
                  spellCheck={false}
                  className={`${CONTROL} resize-none font-mono text-[11px]`}
                  style={{ ...CONTROL_STYLE, userSelect: 'text', background: 'var(--color-hover)' }}
                />
                <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                  On claude.ai: F12 → Network → click any request starting with "api" → Request Headers → copy the
                  whole Cookie value.
                </p>
              </div>
            </div>
          )}
        </Section>

        <Section title="Window">
          <CheckboxRow
            checked={draft.startWithWindows}
            label="Start with Windows"
            onChange={(v) => setField('startWithWindows', v)}
          />
          <CheckboxRow
            checked={draft.rememberPosition}
            label="Remember position"
            onChange={(v) => setField('rememberPosition', v)}
          />
        </Section>

        <Section title="About">
          <p className="px-1.5 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
            Daylo {APP_VERSION}. A quiet desktop companion.
          </p>
          <p className="px-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            Weather icons by Meteocons, licensed under MIT.
          </p>
        </Section>
      </div>

      <div
        className="flex items-center justify-end gap-3 border-t px-5 py-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="flex items-center gap-1 text-[12px]" role="status" style={{ color: 'var(--color-text-secondary)' }}>
          {applyState === 'applied' && (
            <>
              <Check size={13} strokeWidth={2.25} aria-hidden /> Applied
            </>
          )}
          {applyState === 'failed' && 'Could not save settings'}
        </span>
        <button
          type="button"
          onClick={() => void apply()}
          disabled={!ready || !isDirty}
          className="rounded-md px-4 py-1.5 text-[13px] font-medium transition-opacity disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#111215' }}
        >
          Apply
        </button>
      </div>
    </div>
  )
}
