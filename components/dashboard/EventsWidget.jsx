import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiClock, FiAlertCircle } from "react-icons/fi";

export default function EventsWidget({ events = [] }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <FiAlertCircle className="text-red-500" />;
      case "medium":
        return <FiClock className="text-yellow-500" />;
      case "low":
        return <FiCalendar className="text-green-500" />;
      default:
        return <FiCalendar className="text-blue-500" />;
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-80 hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-500 rounded-lg mr-3">
            <FiCalendar className="text-white text-lg" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Eventos Próximos
          </h3>
        </div>
        <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full font-medium">
          {events.length} eventos
        </span>
      </div>

      <div className="space-y-3 max-h-56 overflow-y-auto">
        <AnimatePresence>
          {events.length > 0 ? (
            events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
              >
                <div
                  className={`w-3 h-3 rounded-full ${getPriorityColor(
                    event.priority
                  )} flex-shrink-0`}
                ></div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-600 transition-colors">
                    {event.title}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    {getPriorityIcon(event.priority)}
                    <span className="ml-1">
                      {new Date(event.date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">→</span>
                  </div>
                </motion.div>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiCalendar className="text-gray-400 text-xl" />
              </div>
              <p className="text-gray-500 text-sm">No hay eventos próximos</p>
              <p className="text-gray-400 text-xs mt-1">
                ¡Tu agenda está libre!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {events.length > 0 && (
        <motion.div
          className="mt-4 pt-4 border-t border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors">
            Ver todos los eventos →
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
