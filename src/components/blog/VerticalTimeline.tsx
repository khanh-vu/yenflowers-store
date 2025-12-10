import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface TimelineFilterProps {
    availableMonths: string[]; // Months from currently loaded posts
    selectedMonth: string | null;
    activeMonth?: string | null;
    onSelectMonth: (month: string | null) => void;
}

// Generate all months from 2020 to now
function generateAllMonths(): string[] {
    const months: string[] = [];
    const now = new Date();
    const startYear = 2020; // Show archive from 2020

    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    const startMonth = new Date(startYear, 0, 1);

    while (current >= startMonth) {
        const monthName = current.toLocaleDateString('en-US', { month: 'long' });
        const year = current.getFullYear();
        months.push(`${monthName} ${year}`);
        current.setMonth(current.getMonth() - 1);
    }

    return months;
}

// Group months by year
function groupByYear(months: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    months.forEach(monthStr => {
        const parts = monthStr.split(' ');
        const year = parts[parts.length - 1];
        const month = parts.slice(0, -1).join(' ');

        if (!groups[year]) groups[year] = [];
        if (!groups[year].includes(month)) {
            groups[year].push(month);
        }
    });

    return groups;
}

// Abbreviate month names
function abbreviateMonth(month: string): string {
    const abbrev: Record<string, string> = {
        'January': 'Jan', 'February': 'Feb', 'March': 'Mar',
        'April': 'Apr', 'May': 'May', 'June': 'Jun',
        'July': 'Jul', 'August': 'Aug', 'September': 'Sep',
        'October': 'Oct', 'November': 'Nov', 'December': 'Dec',
    };
    return abbrev[month] || month.slice(0, 3);
}

export default function VerticalTimeline({
    availableMonths,
    selectedMonth,
    activeMonth,
    onSelectMonth,
}: TimelineFilterProps) {
    // Generate full timeline of all months
    const allMonths = generateAllMonths();
    const grouped = groupByYear(allMonths);
    const years = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));

    // Track which years are expanded - current year expanded by default
    const currentYear = new Date().getFullYear().toString();
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set([currentYear]));

    // Check if a month has posts (from loaded data)
    const hasPostsInMonth = (month: string, year: string) => {
        return availableMonths.includes(`${month} ${year}`);
    };

    const toggleYear = (year: string) => {
        setExpandedYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) {
                next.delete(year);
            } else {
                next.add(year);
            }
            return next;
        });
    };

    return (
        <div className="sticky top-28">
            {/* All Stories button */}
            <button
                onClick={() => onSelectMonth(null)}
                className={cn(
                    "w-full text-left px-4 py-2 mb-6 rounded-lg transition-colors font-medium",
                    !selectedMonth
                        ? "bg-stone-800 text-white"
                        : "text-stone-600 hover:bg-stone-100"
                )}
            >
                All Stories
            </button>

            {/* Timeline - Scrollable */}
            <div className="relative max-h-[60vh] overflow-y-auto pr-2">
                {years.map((year) => {
                    const isExpanded = expandedYears.has(year);
                    const monthsInYear = grouped[year];
                    const isSelectedYear = selectedMonth?.endsWith(year);

                    return (
                        <div key={year} className="mb-2">
                            {/* Year Header - Collapsible */}
                            <button
                                onClick={() => toggleYear(year)}
                                className={cn(
                                    "flex items-center justify-between w-full text-left py-2 px-3 rounded-lg transition-colors",
                                    isSelectedYear
                                        ? "bg-stone-100"
                                        : "hover:bg-stone-50"
                                )}
                            >
                                <span className="text-sm font-semibold text-stone-800">
                                    {year}
                                </span>

                                <ChevronDown className={cn(
                                    "w-4 h-4 text-stone-400 transition-transform duration-200",
                                    isExpanded && "rotate-180"
                                )} />
                            </button>

                            {/* Months - Collapsible */}
                            <div className={cn(
                                "overflow-hidden transition-all duration-200 ease-in-out",
                                isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                            )}>
                                <div className="py-1 pl-3 space-y-0.5">
                                    {monthsInYear.map((month) => {
                                        const fullMonth = `${month} ${year}`;
                                        const isSelected = selectedMonth === fullMonth;
                                        const isActive = activeMonth === fullMonth;
                                        const hasPosts = hasPostsInMonth(month, year);

                                        return (
                                            <button
                                                key={fullMonth}
                                                onClick={() => onSelectMonth(fullMonth)}
                                                className={cn(
                                                    "flex items-center w-full text-left py-1.5 px-3 rounded-md transition-colors text-sm",
                                                    isSelected
                                                        ? "bg-stone-800 text-white"
                                                        : isActive
                                                            ? "bg-stone-100 text-stone-900"
                                                            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-1.5 h-1.5 rounded-full mr-2",
                                                    isSelected
                                                        ? "bg-white"
                                                        : hasPosts
                                                            ? "bg-primary"
                                                            : "bg-stone-300"
                                                )} />
                                                {abbreviateMonth(month)}
                                                {hasPosts && (
                                                    <span className="ml-auto text-xs text-stone-400">•</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
