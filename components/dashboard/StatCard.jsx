import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import CountUp from "react-countup";

export default function StatCard({
  title,
  value,
  change,
  changeType = "positive",
  icon,
  color = "gray",
  prefix = "",
  suffix = "",
  decimals = 0,
}) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    indigo: "bg-indigo-500",
    red: "bg-red-500",
    gray: "bg-gray-500",
    emerald: "bg-emerald-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
    yellow: "bg-yellow-500",
    rose: "bg-rose-500",
    teal: "bg-teal-500",
  };

  const changeIcon =
    changeType === "positive" ? <FiTrendingUp /> : <FiTrendingDown />;
  const changeColor =
    changeType === "positive" ? "text-green-600" : "text-red-600";

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 group relative overflow-hidden hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className={`p-3 rounded-xl ${colorClasses[color]} shadow-lg`}
            whileHover={{ rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-white text-xl">{icon}</div>
          </motion.div>

          {change && (
            <div className={`flex items-center space-x-1 ${changeColor}`}>
              {changeIcon}
              <span className="text-sm font-medium">
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </h3>

          <div className="text-3xl font-bold text-gray-900">
            {prefix}
            <CountUp
              end={value}
              duration={2.5}
              decimals={decimals}
              preserveValue
            />
            {suffix}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
