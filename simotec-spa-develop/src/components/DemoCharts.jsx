import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from "recharts";

const DemoCharts = () => {
  // Datos de ejemplo
  const data = [
    { name: "Enero", ventas: 4000, compras: 2400 },
    { name: "Febrero", ventas: 3000, compras: 1398 },
    { name: "Marzo", ventas: 2000, compras: 9800 },
    { name: "Abril", ventas: 2780, compras: 3908 },
    { name: "Mayo", ventas: 1890, compras: 4800 },
    { name: "Junio", ventas: 2390, compras: 3800 },
    { name: "Julio", ventas: 3490, compras: 4300 },
  ];

  const pieData = [
    { name: "Grupo A", value: 400 },
    { name: "Grupo B", value: 300 },
    { name: "Grupo C", value: 300 },
    { name: "Grupo D", value: 200 },
  ];

  return (
    <>
      {/* Gráfico de Líneas */}
      <div style={{ width: "48%", height: 400 }}>
        <h3>Gráfico de Líneas</h3>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ventas" stroke="#8884d8" />
            <Line type="monotone" dataKey="compras" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Barras */}
      <div style={{ width: "48%", height: 400 }}>
        <h3>Gráfico de Barras</h3>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="ventas" fill="#1c20ff" />
            <Bar dataKey="compras" fill="#1cff1c" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Áreas */}
      <div style={{ width: "48%", height: 400 }}>
        <h3>Gráfico de Áreas</h3>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#8884d8"
              fill="#8884d8"
            />
            <Area
              type="monotone"
              dataKey="compras"
              stroke="#82ca9d"
              fill="#82ca9d"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Dispersión */}
      {/* <div style={{ width: "48%", height: 400 }}>
        <h3>Gráfico de Dispersión</h3>
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ventas" />
            <YAxis dataKey="compras" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name="Ventas vs Compras" data={data} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div> */}

      {/* Gráfico de Barras Radiales */}
      {/* <div style={{ width: "48%", height: 400 }}>
        <h3>Gráfico de Barras Radiales</h3>
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="10%"
            outerRadius="80%"
            barSize={10}
            data={data}
          >
            <RadialBar
              minAngle={15}
              label={{ position: "insideStart", fill: "#fff" }}
              background
              clockWise
              dataKey="ventas"
            />
            <Legend iconSize={10} layout="vertical" verticalAlign="middle" />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>
      </div> */}

      {/* Gráfico Circular */}
      <div style={{ width: "48%", height: 400 }}>
        <h3>Gráfico Circular</h3>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
            />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={110}
              outerRadius={140}
              fill="#82ca9d"
              label
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default DemoCharts;
