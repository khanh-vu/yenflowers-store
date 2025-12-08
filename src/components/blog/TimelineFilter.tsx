import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TimelineFilterProps {
    availableMonths: string[];
    selectedMonth: string | null;
    onSelectMonth: (month: string | null) => void;
}

export default function TimelineFilter({ availableMonths, selectedMonth, onSelectMonth }: TimelineFilterProps) {
    // Sort months (assuming format "Month Year")
    // This sorting is basic, might need refinement if strings are multilingual
    const sortedMonths = [...availableMonths].sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime(); // Try parsing "Month Year" directly
    }).reverse(); // Newest first

    return (
        <div className="sticky top-24 bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white shadow-lg">
            <h3 className="text-lg font-serif font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-pink-500 rounded-full inline-block"></span>
                Timeline
            </h3>

            <nav className="space-y-1">
                <Button
                    variant="ghost"
                    onClick={() => onSelectMonth(null)}
                    className={cn(
                        "w-full justify-start text-sm font-medium transition-all duration-300",
                        !selectedMonth
                            ? "bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800"
                            : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                    )}
                >
                    <span className="flex-1 text-left">All Stories</span>
                    {!selectedMonth && <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />}
                </Button>

                {sortedMonths.map(month => (
                    <Button
                        key={month}
                        variant="ghost"
                        onClick={() => onSelectMonth(month)}
                        className={cn(
                            "w-full justify-start text-sm transition-all duration-300 group",
                            selectedMonth === month
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 font-semibold"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 hover:pl-6"
                        )}
                    >
                        <span className="flex-1 text-left">{month}</span>
                        {selectedMonth === month && <ChevronRight className="w-4 h-4 text-amber-500" />}
                    </Button>
                ))}
            </nav>
        </div>
    );
}
