import React from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type SeriesConfig } from "@/lib/result-formatter";

// Color palette for charts (accessible colors)
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe',
  '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57'
];

interface DynamicChartProps {
  chartType: string;
  title: string;
  subtitle?: string;
  xAxis: string;
  yAxis: string;
  xAxisKey?: string;
  series?: SeriesConfig[];
  data?: any[];
  insights?: string;
  onDownload?: () => void;
}

export default function DynamicChart({
  chartType = 'bar',
  title,
  subtitle,
  xAxis,
  yAxis,
  xAxisKey,
  series = [],
  data = [],
  insights,
  onDownload
}: DynamicChartProps) {
  const [activeTab, setActiveTab] = React.useState('chart');
  
  // Make sure we have chart data to display
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || 'No Data'}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-gray-500">No data available for visualization</p>
        </CardContent>
      </Card>
    );
  }
  
  // Determine the data key to use for the x-axis
  const dataKey = xAxisKey || (data[0] && Object.keys(data[0])[0]) || 'name';
  
  // Create chart content based on chart type
  const renderChart = () => {
    switch (chartType.toLowerCase()) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKey} label={{ value: xAxis, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: yAxis, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {series && series.length > 0 ? (
              series.map((s, index) => (
                <Bar 
                  key={s.dataKey} 
                  dataKey={s.dataKey} 
                  name={s.name}
                  fill={s.color || COLORS[index % COLORS.length]} 
                />
              ))
            ) : (
              <Bar dataKey={Object.keys(data[0])[1] || 'value'} fill="#8884d8" />
            )}
          </BarChart>
        );
        
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKey} label={{ value: xAxis, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: yAxis, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {series && series.length > 0 ? (
              series.map((s, index) => (
                <Line 
                  key={s.dataKey} 
                  type="monotone" 
                  dataKey={s.dataKey} 
                  name={s.name}
                  stroke={s.color || COLORS[index % COLORS.length]} 
                  activeDot={{ r: 8 }}
                />
              ))
            ) : (
              <Line type="monotone" dataKey={Object.keys(data[0])[1] || 'value'} stroke="#8884d8" activeDot={{ r: 8 }} />
            )}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKey} label={{ value: xAxis, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: yAxis, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {series && series.length > 0 ? (
              series.map((s, index) => (
                <Area 
                  key={s.dataKey} 
                  type="monotone" 
                  dataKey={s.dataKey} 
                  name={s.name}
                  fill={s.color || COLORS[index % COLORS.length]}
                  stroke={s.color || COLORS[index % COLORS.length]}
                />
              ))
            ) : (
              <Area type="monotone" dataKey={Object.keys(data[0])[1] || 'value'} fill="#8884d8" stroke="#8884d8" />
            )}
          </AreaChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              dataKey={series && series.length > 0 ? series[0].dataKey : Object.keys(data[0])[1] || 'value'}
              nameKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
        
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              dataKey={series && series.length > 0 ? series[0].dataKey : Object.keys(data[0])[0]}
              name={xAxis}
            />
            <YAxis 
              type="number"
              dataKey={series && series.length > 1 ? series[1].dataKey : Object.keys(data[0])[1]}
              name={yAxis}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter 
              name={title} 
              data={data} 
              fill="#8884d8" 
            />
          </ScatterChart>
        );
        
      case 'composed':
        return (
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKey} label={{ value: xAxis, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: yAxis, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {series && series.map((s, index) => {
              const Component = {
                'bar': Bar,
                'line': Line,
                'area': Area
              }[s.type || 'bar'] || Bar;
              
              return (
                <Component
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  name={s.name}
                  fill={s.color || COLORS[index % COLORS.length]}
                  stroke={s.color || COLORS[index % COLORS.length]}
                  type={s.type === 'line' ? 'monotone' : undefined}
                />
              );
            })}
          </ComposedChart>
        );
      
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={Object.keys(data[0])[1] || 'value'} fill="#8884d8" />
          </BarChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
          </div>
          
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              Download Data
            </Button>
          )}
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            {insights && <TabsTrigger value="insights">Insights</TabsTrigger>}
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chart" className="p-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </TabsContent>
        
        {insights && (
          <TabsContent value="insights" className="p-6">
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="font-medium mb-2">Key Insights</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{insights}</p>
            </div>
          </TabsContent>
        )}
        
        <TabsContent value="data" className="p-6">
          <div className="h-[400px] w-full">
            <ScrollArea className="h-full w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {data.length > 0 && Object.keys(data[0]).map(key => (
                      <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}