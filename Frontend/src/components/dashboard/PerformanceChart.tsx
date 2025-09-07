import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../styles/components/PerformanceChart.module.css';

interface PerformanceData {
  date: string;
  value: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  height?: number;
}

const PerformanceChart = ({ data, height = 300 }: PerformanceChartProps) => {
  if (data.length === 0) {
    return (
      <div className={styles.emptyChart}>
        <div className={styles.emptyIcon}>📈</div>
        <p>No performance data available</p>
      </div>
    );
  }

  const formatTooltip = (value: number) => {
    return formatCurrency(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#9CA3AF"
          />
          <YAxis 
            tickFormatter={formatCurrency}
            stroke="#9CA3AF"
          />
          <Tooltip
            formatter={(value) => [formatTooltip(Number(value)), 'Value']}
            labelFormatter={formatDate}
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#059669' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
