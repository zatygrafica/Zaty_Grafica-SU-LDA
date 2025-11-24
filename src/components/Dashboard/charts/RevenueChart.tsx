import React, { useMemo } from 'react';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { EChartsOption } from 'echarts';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import Chart from './Chart';
import { useStore } from '@/store/useStore';

const RevenueChart: React.FC = () => {
  const { invoices } = useInvoiceStore();
  const { theme, settings } = useStore();

  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const revenueByDay = dateRange.map(date => {
      const dailyInvoices = invoices.filter(invoice => 
        isSameDay(new Date(invoice.createdAt), date)
      );
      const dailyRevenue = dailyInvoices.reduce((sum, inv) => sum + inv.order.total, 0);
      return {
        date: format(date, 'dd/MM'),
        revenue: dailyRevenue
      };
    });

    return {
      dates: revenueByDay.map(d => d.date),
      revenues: revenueByDay.map(d => d.revenue.toFixed(2)),
    };
  }, [invoices]);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: chartData.dates,
        axisLabel: {
          color: theme === 'dark' ? '#ccc' : '#333'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          formatter: `{value} ${settings.currency}`,
          color: theme === 'dark' ? '#ccc' : '#333'
        }
      }
    ],
    series: [
      {
        name: 'Receita',
        type: 'line',
        stack: 'Total',
        emphasis: {
          focus: 'series'
        },
        data: chartData.revenues,
        smooth: true,
        itemStyle: {
          color: '#0284c7' // primary-600
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
                offset: 0, color: '#0ea5e9' // primary-500
            }, {
                offset: 1, color: 'rgba(2, 132, 199, 0.1)' 
            }]
          }
        },
      }
    ],
    backgroundColor: 'transparent',
  };

  return <Chart option={option} />;
};

export default RevenueChart;
