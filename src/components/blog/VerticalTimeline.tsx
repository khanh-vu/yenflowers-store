import { cn } from '@/lib/utils';

interface TimelineFilterProps {
    availableMonths: string[];
    selectedMonth: string | null;
    onSelectMonth: (month: string | null) => void;
}

// Group months by year
function groupByYear(months: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    months.forEach(monthStr => {
        const parts = monthStr.split(' ');
        const year = parts[parts.length - 1];
        const month = parts.slice(0, -1).join(' ');

        if (!groups[year]) groups[year] = [];
        groups[year].push(month);
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
        // Vietnamese
        'Tháng 1': 'Th1', 'Tháng 2': 'Th2', 'Tháng 3': 'Th3',
        'Tháng 4': 'Th4', 'Tháng 5': 'Th5', 'Tháng 6': 'Th6',
        'Tháng 7': 'Th7', 'Tháng 8': 'Th8', 'Tháng 9': 'Th9',
        'Tháng 10': 'Th10', 'Tháng 11': 'Th11', 'Tháng 12': 'Th12',
    };
    return abbrev[month] || month.slice(0, 3);
}

export default function VerticalTimeline({ availableMonths, selectedMonth, onSelectMonth }: TimelineFilterProps) {
    const grouped = groupByYear(availableMonths);
    const years = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));

    return (
        <div className="sticky top-8">
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

            {/* Timeline */}
            <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-3 top-0 bottom-0 w-px bg-stone-300" />

                {years.map((year, yearIndex) => (
                    <div key={year} className="mb-8">
                        {grouped[year].map((month, monthIndex) => {
                            const fullMonth = `${month} ${year}`;
                            const isSelected = selectedMonth === fullMonth;
                            const isFirst = yearIndex === 0 && monthIndex === 0;

                            return (
                                <button
                                    key={fullMonth}
                                    onClick={() => onSelectMonth(fullMonth)}
                                    className="relative flex items-start mb-6 w-full text-left group"
                                >
                                    {/* Dot on timeline */}
                                    <div
                                        className={cn(
                                            "absolute -left-5 top-1 w-2 h-2 rounded-full border-2 transition-colors",
                                            isSelected
                                                ? "bg-stone-800 border-stone-800"
                                                : "bg-white border-stone-400 group-hover:border-stone-600"
                                        )}
                                    />

                                    {/* Month/Year labels */}
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-lg font-serif transition-colors",
                                            isSelected ? "text-stone-900 font-semibold" : "text-stone-600 group-hover:text-stone-900"
                                        )}>
                                            {abbreviateMonth(month)}
                                        </span>
                                        {(isFirst || monthIndex === 0) && (
                                            <span className="text-xs text-stone-400 mt-0.5">{year}</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
