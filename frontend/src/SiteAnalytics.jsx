import { useEffect, useState } from "react";
import axios from "axios";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API = "http://127.0.0.1:8000";

function SiteAnalytics({ site, onBack }) {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await axios.get(
          `${API}/sites/${site.id}/analytics/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAnalytics(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [site.id]);

  if (loading) {
    return <h2>Loading analytics...</h2>;
  }

  const chartData = {
    labels: analytics.map((item) => item.date),

    datasets: [
      {
        label: "Carbon",
        data: analytics.map(
          (item) => item.carbon_value
        ),
      },
      {
        label: "Biodiversity",
        data: analytics.map(
          (item) => item.biodiversity_value
        ),
      },
      {
        label: "Performance",
        data: analytics.map(
          (item) => item.performance_value
        ),
      },
    ],
  };

  const chartOptions = {
    responsive: true,

    plugins: {
      legend: {
        position: "top",
      },

      title: {
        display: true,
        text: "Site Performance Over Time",
      },
    },

    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      <button onClick={onBack}>
        ← Back to Project
      </button>

      <h1>{site.name}</h1>

      <p>
        Site ID: {site.id}
      </p>

      <p>
        Area:{" "}
        {site.area
          ? `${(site.area / 10000).toFixed(2)} hectares`
          : "N/A"}
      </p>

      <hr />

      <h2>Analytics</h2>

      {analytics.length === 0 ? (
        <p>No analytics data available.</p>
      ) : (
        <>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "25px",
              marginTop: "20px",
            }}
          >
            <Line
              data={chartData}
              options={chartOptions}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "20px",
              marginTop: "30px",
            }}
          >
            <MetricCard
              title="Carbon"
              value={
                analytics[
                  analytics.length - 1
                ].carbon_value
              }
            />

            <MetricCard
              title="Biodiversity"
              value={
                analytics[
                  analytics.length - 1
                ].biodiversity_value
              }
            />

            <MetricCard
              title="Performance"
              value={
                analytics[
                  analytics.length - 1
                ].performance_value
              }
            />
          </div>

          <h2 style={{ marginTop: "40px" }}>
            Historical Data
          </h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={cellStyle}>Date</th>
                <th style={cellStyle}>Carbon</th>
                <th style={cellStyle}>
                  Biodiversity
                </th>
                <th style={cellStyle}>
                  Performance
                </th>
              </tr>
            </thead>

            <tbody>
              {analytics.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}>
                    {item.date}
                  </td>

                  <td style={cellStyle}>
                    {item.carbon_value}
                  </td>

                  <td style={cellStyle}>
                    {item.biodiversity_value}
                  </td>

                  <td style={cellStyle}>
                    {item.performance_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "25px",
        textAlign: "center",
      }}
    >
      <h3>{title}</h3>

      <div
        style={{
          fontSize: "32px",
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const cellStyle = {
  border: "1px solid #ddd",
  padding: "12px",
  textAlign: "center",
};

export default SiteAnalytics;