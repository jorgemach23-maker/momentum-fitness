import React from 'react';
import Calendar from 'react-calendar';
import '../../styles/Calendar.css'; 
import { Icon } from '../ui/Icon';

export const CalendarWidget = ({ history, onDateChange, selectedDate, t }) => {
    const trainedDays = React.useMemo(() => {
        return history.reduce((acc, r) => {
            if (r.status === 'completed' && r.createdAt?.seconds) {
                const date = new Date(r.createdAt.seconds * 1000).toDateString();
                acc.add(date);
            }
            return acc;
        }, new Set());
    }, [history]);

    const tileContent = ({ date, view }) => {
        if (view === 'month' && trainedDays.has(date.toDateString())) {
            return <div className="trained-day-dot"></div>;
        }
        return null;
    };

    // FINAL FIX: Hardcoded weekdays to bypass the caching issue with the 't' prop.
    const formatShortWeekday = (locale, date) => {
        const weekdays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
        return weekdays[date.getDay()];
    };

    return (
        <Calendar
            onChange={onDateChange}
            value={selectedDate}
            tileContent={tileContent}
            className="w-full bg-slate-800/20 p-4 rounded-xl border border-slate-700/50"
            prevLabel={<Icon name="chevronLeft" className="w-5 h-5" />}
            nextLabel={<Icon name="chevronRight" className="w-5 h-5" />}
            next2Label={null}
            prev2Label={null}
            formatShortWeekday={formatShortWeekday}
        />
    );
};