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

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function SiteAnalytics({ site, onBack }) {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [date, setDate] = useState("");
  const [carbonValue, setCarbonValue] = useState("");
  const [biodiversityValue, setBiodiversityValue] = useState("");
  const [performanceValue, setPerformanceValue] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      const response = await axios.get(`${API}/sites/${site.id}/analytics/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAnalytics(response.data);
    } catch (error) {
      console.error("Analytics loading error:", error);

      setError(
        error.response?.data?.detail || "Unable to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await axios.get(`${API}/sites/${site.id}/analytics/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!cancelled) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);

        if (!cancelled) {
          setAnalytics([]);
        }
      }
    };

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [site.id]);

  const addAnalytics = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!date) {
      setError("Please select a date.");
      return;
    }

    const carbon = Number(carbonValue);
    const biodiversity = Number(biodiversityValue);
    const performance = Number(performanceValue);

    if (
      Number.isNaN(carbon) ||
      Number.isNaN(biodiversity) ||
      Number.isNaN(performance)
    ) {
      setError("Please enter valid numbers.");
      return;
    }

    if (
      carbon < 0 ||
      carbon > 100 ||
      biodiversity < 0 ||
      biodiversity > 100 ||
      performance < 0 ||
      performance > 100
    ) {
      setError("Values must be between 0 and 100.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("access_token");

      await axios.post(
        `${API}/sites/${site.id}/analytics/`,
        {
          date,
          carbon_value: carbon,
          biodiversity_value: biodiversity,
          performance_value: performance,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDate("");
      setCarbonValue("");
      setBiodiversityValue("");
      setPerformanceValue("");

      setMessage("Analytics added successfully!");

      await loadAnalytics();
    } catch (error) {
      console.error("Analytics creation error:", error);

      setError(error.response?.data?.detail || "Could not add analytics.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          ← Back to Project
        </button>

        <div style={messageStyle}>Loading analytics...</div>
      </div>
    );
  }

  const chartData = {
    labels: analytics.map((item) => item.date),

    datasets: [
      {
        label: "Carbon",
        data: analytics.map((item) => item.carbon_value),
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: "Biodiversity",
        data: analytics.map((item) => item.biodiversity_value),
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: "Performance",
        data: analytics.map((item) => item.performance_value),
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "index",
      intersect: false,
    },

    plugins: {
      legend: {
        position: "top",
      },

      title: {
        display: true,
        text: "Site Performance Over Time",
        font: {
          size: 18,
        },
      },

      tooltip: {
        enabled: true,
      },
    },

    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },

      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  const latest = analytics.length > 0 ? analytics[analytics.length - 1] : null;

  return (
    <div style={pageStyle}>
      <button onClick={onBack} style={backButtonStyle}>
        ← Back to Project
      </button>

      <h1 style={titleStyle}>{site.name}</h1>

      <div style={siteInfoStyle}>
        <div>
          <strong>Site ID</strong>
          <span>{site.id}</span>
        </div>

        <div>
          <strong>Area</strong>
          <span>
            {site.area ? `${(site.area / 10000).toFixed(2)} hectares` : "N/A"}
          </span>
        </div>
      </div>

      <hr style={{ margin: "30px 0" }} />

      <h2>Analytics</h2>

      {/* ADD ANALYTICS */}
      <div style={formCardStyle}>
        <h3>Add Analytics Data</h3>

        <form onSubmit={addAnalytics}>
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Date</label>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                style={formInputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Carbon</label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 82.5"
                value={carbonValue}
                onChange={(event) => setCarbonValue(event.target.value)}
                style={formInputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Biodiversity</label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 76.2"
                value={biodiversityValue}
                onChange={(event) => setBiodiversityValue(event.target.value)}
                style={formInputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Performance</label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 80.1"
                value={performanceValue}
                onChange={(event) => setPerformanceValue(event.target.value)}
                style={formInputStyle}
                required
              />
            </div>
          </div>

          <button type="submit" style={primaryButtonStyle} disabled={saving}>
            {saving ? "Saving..." : "Add Analytics"}
          </button>
        </form>

        {message && <p style={successStyle}>{message}</p>}

        {error && <p style={errorStyle}>{error}</p>}
      </div>

      {/* CHART / EMPTY STATE */}
      {analytics.length === 0 ? (
        <div style={emptyStyle}>
          <h3>No analytics data available</h3>

          <p>Add your first analytics record above to generate the chart.</p>
        </div>
      ) : (
        <>
          {/* CHART */}
          <div style={chartCardStyle}>
            <div style={chartContainerStyle}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* METRICS */}
          {latest && (
            <div style={metricsGridStyle}>
              <MetricCard title="Carbon" value={latest.carbon_value} />

              <MetricCard
                title="Biodiversity"
                value={latest.biodiversity_value}
              />

              <MetricCard
                title="Performance"
                value={latest.performance_value}
              />
            </div>
          )}

          {/* TABLE */}
          <h2 style={{ marginTop: "45px" }}>Historical Data</h2>

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={cellStyle}>Date</th>

                  <th style={cellStyle}>Carbon</th>

                  <th style={cellStyle}>Biodiversity</th>

                  <th style={cellStyle}>Performance</th>
                </tr>
              </thead>

              <tbody>
                {analytics.map((item) => (
                  <tr key={item.id}>
                    <td style={cellStyle}>{item.date}</td>

                    <td style={cellStyle}>{item.carbon_value}</td>

                    <td style={cellStyle}>{item.biodiversity_value}</td>

                    <td style={cellStyle}>{item.performance_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricTitleStyle}>{title}</div>

      <div style={metricValueStyle}>{value}</div>
    </div>
  );
}

const pageStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "30px",
  fontFamily: "Arial, sans-serif",
};

const backButtonStyle = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "1px solid #555",
  background: "#222",
  color: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};

const titleStyle = {
  marginTop: "25px",
};

const siteInfoStyle = {
  display: "flex",
  gap: "40px",
  marginTop: "15px",
  flexWrap: "wrap",
};

const formCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "25px",
  marginTop: "20px",
  marginBottom: "25px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "20px",
};

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  marginBottom: "8px",
};

const formInputStyle = {
  width: "100%",
  padding: "12px",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const primaryButtonStyle = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const chartCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "25px",
  background: "#fff",
};

const chartContainerStyle = {
  position: "relative",
  width: "100%",
  height: "400px",
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginTop: "30px",
};

const metricCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "25px",
  textAlign: "center",
  background: "#fff",
};

const metricTitleStyle = {
  fontSize: "18px",
  marginBottom: "10px",
};

const metricValueStyle = {
  fontSize: "32px",
  fontWeight: "bold",
};

const tableWrapperStyle = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px",
};

const cellStyle = {
  border: "1px solid #ddd",
  padding: "12px",
  textAlign: "center",
};

const messageStyle = {
  padding: "40px",
  textAlign: "center",
};

const emptyStyle = {
  marginTop: "20px",
  padding: "30px",
  border: "1px solid #ddd",
  borderRadius: "12px",
  textAlign: "center",
};

const successStyle = {
  color: "#16a34a",
  marginTop: "15px",
};

const errorStyle = {
  color: "#dc2626",
  marginTop: "15px",
};

export default SiteAnalytics;
