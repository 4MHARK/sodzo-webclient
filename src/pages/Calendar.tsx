import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDeviceDetection } from "../hooks/useDeviceDetection";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  type?: string;
  status?: string;
}

export default function Calendar() {
  const { api, logout } = useAuth();
  const { isMobile } = useDeviceDetection();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month/year
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Fetch calendar events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Note: Calendar endpoint requires tenant_id and project_id
        // For now, we'll try to fetch calendar data if user context is available
        // TODO: You may need to select a project or use a default project
        // The endpoint is: GET /event-calendar?tenant_id={tenantId}&project_id={projectId}&month={YYYY-MM}

        // Placeholder: Calendar events endpoint structure
        // When ready, uncomment and provide tenantId and projectId:
        // const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        // const res = await api.get(`/event-calendar?tenant_id=${tenantId}&project_id=${projectId}&month=${monthStr}`);
        // const calendarData = res.data?.data || [];

        // Placeholder: empty events array until calendar data structure is confirmed
        setEvents([]);
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          toast.error("Session expired — please sign in again");
        } else {
          toast.error("Failed to load calendar events");
          console.error("Calendar fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [year, month, api, logout]);

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Get events for a specific date
  const getEventsForDate = (date: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      date
    ).padStart(2, "0")}`;
    return events.filter((event) => {
      const eventDate = new Date(event.startDate).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
  };

  // Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading calendar...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 mobile:space-y-4 md:space-y-6">
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            View and manage calendar events
          </p>
        </div>
      )}

      {/* Calendar View */}
      <div
        className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
          isMobile ? "mobile-card-elevated" : "bg-white dark:bg-gray-800"
        }`}>
        {/* Calendar Header */}
        <div className="p-4 mobile:p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 mobile:space-x-2 md:space-x-4">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h2 className="text-base mobile:text-base md:text-xl font-semibold text-gray-900 dark:text-white">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 mobile:px-3 md:px-4 py-2 text-xs mobile:text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-target">
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-3 mobile:p-3 md:p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mobile:gap-1 md:gap-2 mb-2 mobile:mb-2 md:mb-4">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs mobile:text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 py-1 mobile:py-1 md:py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 mobile:gap-1 md:gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square"></div>
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayEvents = getEventsForDate(day);
              const todayClass = isToday(day)
                ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                : "border border-gray-200 dark:border-gray-700";

              return (
                <div
                  key={day}
                  className={`aspect-square p-1 mobile:p-1 md:p-2 rounded-lg ${todayClass} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    isMobile ? "min-h-[3rem]" : ""
                  }`}>
                  <div
                    className={`text-xs mobile:text-xs md:text-sm font-medium mb-0.5 mobile:mb-0.5 md:mb-1 ${
                      isToday(day)
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}>
                    {day}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="space-y-0.5 mobile:space-y-0.5 md:space-y-1">
                      {dayEvents.slice(0, isMobile ? 1 : 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-[10px] mobile:text-[10px] md:text-xs px-1 mobile:px-1 md:px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded truncate">
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > (isMobile ? 1 : 2) && (
                        <div className="text-[10px] mobile:text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                          +{dayEvents.length - (isMobile ? 1 : 2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events List */}
      {events.length > 0 && (
        <div
          className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${
            isMobile ? "mobile-card" : "bg-white dark:bg-gray-800"
          }`}>
          <div className="p-4 mobile:p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Events
            </h2>
          </div>
          <div className="p-4 mobile:p-4 md:p-6 space-y-3 mobile:space-y-3 md:space-y-4">
            {events
              .sort(
                (a, b) =>
                  new Date(a.startDate).getTime() -
                  new Date(b.startDate).getTime()
              )
              .slice(0, 10)
              .map((event) => (
                <motion.div
                  key={event.id}
                  className={`flex items-start space-x-3 mobile:space-x-3 md:space-x-4 p-3 mobile:p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all active:scale-[0.98] ${
                    isMobile ? "mobile-card backdrop-blur-sm" : "rounded-lg"
                  }`}
                  whileHover={!isMobile ? { x: 4 } : {}}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}>
                  <div className="flex-shrink-0 mt-0.5 mobile:mt-0.5 md:mt-1">
                    <CalendarIcon className="w-4 h-4 mobile:w-4 mobile:h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm mobile:text-sm md:text-sm font-semibold text-gray-900 dark:text-white">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-xs mobile:text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-col mobile:flex-col md:flex-row md:items-center md:space-x-4 space-y-1 mobile:space-y-1 md:space-y-0 mt-2">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        <span className="truncate">
                          {new Date(event.startDate).toLocaleDateString()}
                          {event.endDate &&
                            ` - ${new Date(
                              event.endDate
                            ).toLocaleDateString()}`}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {events.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No calendar events found
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Calendar events will appear here when available
          </p>
        </div>
      )}
    </div>
  );
}
