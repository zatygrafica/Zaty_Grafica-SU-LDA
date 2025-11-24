import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '@/store/useOrderStore';
import { EChartsOption } from 'echarts';
import Chart from './Chart';
import { useStore } from '@/store/useStore';

const OrdersByStatusChart: React.FC = () => {
  const { t } = useTranslation();
  const { orders } = useOrderStore();
  const { theme } = useStore();

  const data = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: t(`orders.status.${status}`),
      value: count,
    }));
  }, [orders, t]);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: theme === 'dark' ? '#ccc' : '#333'
      }
    },
    series: [
      {
        name: 'Status dos Pedidos',
        type: 'pie',
        radius: '70%',
        center: ['50%', '60%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          color: theme === 'dark' ? '#ccc' : '#333'
        }
      }
    ],
    backgroundColor: 'transparent',
  };

  return <Chart option={option} />;
};

export default OrdersByStatusChart;
