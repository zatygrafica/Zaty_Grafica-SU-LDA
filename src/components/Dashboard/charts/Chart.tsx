import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { useStore } from '@/store/useStore';

interface ChartProps {
  option: EChartsOption;
  style?: React.CSSProperties;
}

const Chart: React.FC<ChartProps> = ({ option, style }) => {
  const { theme } = useStore();

  return (
    <ReactECharts
      option={option}
      theme={theme === 'dark' ? 'dark' : 'light'}
      style={style || { height: '400px', width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default Chart;
