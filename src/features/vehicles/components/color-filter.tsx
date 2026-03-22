'use client'

const COLOR_MAP = [
  { label: '흰색', css: '#FFFFFF', value: 'white' },
  { label: '검정', css: '#1A1A1A', value: 'black' },
  { label: '실버', css: '#C0C0C0', value: 'silver' },
  { label: '회색', css: '#808080', value: 'gray' },
  { label: '빨강', css: '#DC2626', value: 'red' },
  { label: '파랑', css: '#2563EB', value: 'blue' },
  { label: '네이비', css: '#1E3A5F', value: 'navy' },
  { label: '갈색', css: '#8B4513', value: 'brown' },
  { label: '초록', css: '#16A34A', value: 'green' },
  { label: '베이지', css: '#F5F0DC', value: 'beige' },
  { label: '노랑', css: '#EAB308', value: 'yellow' },
  { label: '기타', css: '', value: 'other' },
] as const

type ColorFilterProps = {
  selectedColors: string[]
  onToggle: (colorValue: string) => void
}

export function ColorFilter({ selectedColors, onToggle }: ColorFilterProps) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {COLOR_MAP.map((color) => {
        const isActive = selectedColors.includes(color.value)
        const isOther = color.value === 'other'

        return (
          <button
            key={color.value}
            type="button"
            onClick={() => onToggle(color.value)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`size-7 rounded-full cursor-pointer transition-all ${
                isActive
                  ? 'border-2 border-accent ring-2 ring-accent/30'
                  : 'border border-border hover:ring-2 hover:ring-accent/50'
              }`}
              style={{
                backgroundColor: isOther ? undefined : color.css,
                background: isOther
                  ? 'conic-gradient(red, yellow, green, blue, red)'
                  : undefined,
              }}
            />
            <span className="text-[10px] text-muted-foreground">
              {color.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
