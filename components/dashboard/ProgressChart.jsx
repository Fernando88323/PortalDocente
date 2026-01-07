import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { FiTrendingUp } from "react-icons/fi";

export default function ProgressChart({
  title,
  data,
  color = "rgb(107, 114, 128)",
}) {
  const chartData = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    datasets: [
      {
        label: title,
        data: data || [65, 72, 68, 75, 78, 82],
        borderColor: color,
        backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.1)"),
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: color,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `${title}: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
          callback: function (value) {
            return value + "%";
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-80 hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-gray-500 rounded-lg mr-3">
            <FiTrendingUp className="text-white text-lg" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="text-sm text-gray-600 font-medium">+5.2% este mes</div>
      </div>
      <div className="h-56">
        <Line data={chartData} options={options} />
      </div>
    </motion.div>
  );
}
