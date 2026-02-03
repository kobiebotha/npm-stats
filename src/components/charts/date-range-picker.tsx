import { useState } from 'react'
import { format, subDays, subYears } from 'date-fns'
import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onRangeChange: (start: string, end: string) => void
}

type PresetRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom'

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [preset, setPreset] = useState<PresetRange>('30d')

  const handlePresetChange = (value: PresetRange) => {
    setPreset(value)
    const today = new Date()
    const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')

    switch (value) {
      case '7d':
        onRangeChange(formatDate(subDays(today, 7)), formatDate(today))
        break
      case '30d':
        onRangeChange(formatDate(subDays(today, 30)), formatDate(today))
        break
      case '90d':
        onRangeChange(formatDate(subDays(today, 90)), formatDate(today))
        break
      case '1y':
        onRangeChange(formatDate(subYears(today, 1)), formatDate(today))
        break
      case 'all':
        onRangeChange('2010-01-01', formatDate(today))
        break
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-400" />
        <Select value={preset} onValueChange={(v) => handlePresetChange(v as PresetRange)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-gray-400">
        {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
      </div>
    </div>
  )
}
