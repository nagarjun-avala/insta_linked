"use client"

import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface ContentDistributionChartProps {
  data: {
    labels: string[]
    data: number[]
  }
}

export default function ContentDistributionChart({ data }: ContentDistributionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    
    // If a chart instance exists, destroy it before creating a new one
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }
    
    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return
    
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(168, 85, 247, 0.8)',    // Purple
      'rgba(236, 72, 153, 0.8)',    // Pink
      'rgba(245, 158, 11, 0.8)',    // Amber
      'rgba(16, 185, 129, 0.8)',    // Emerald
      'rgba(239, 68, 68, 0.8)',     // Red
    ]
    
    const borderColors = [
      'rgba(59, 130, 246, 1)',
      'rgba(168, 85, 247, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(239, 68, 68, 1)',
    ]
    
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            backgroundColor: colors.slice(0, data.labels.length),
            borderColor: borderColors.slice(0, data.labels.length),
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 12,
              },
              padding: 20,
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw as number;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%',
        animation: {
          animateScale: true,
          animateRotate: true
        }
      },
    })
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return (
    <div className="h-full w-full">
      <canvas ref={chartRef} />
    </div>
  )
}
