import { useEffect, useState } from "react";
import axios from "axios";
import MapView from "./MapView";
import SiteAnalytics from "./SiteAnalytics";

const API = "http://127.0.0.1:8000";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  const [showRegister, setShowRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");

  const [siteName, setSiteName] = useState("");
  const [polygon, setPolygon] = useState(null);
  const [sites, setSites] = useState([]);

  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access_token");

  const api = axios.create({
    baseURL: API,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // LOGIN
  const login = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      setLoggedIn(true);
      setMessage("Login successful!");
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Login failed"
      );
    }
  };

  // REGISTER
  const register = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post(`${API}/auth/register`, {
        name: userName,
        email,
        password,
      });

      setMessage(
        "Registration successful! Please login."
      );

      setShowRegister(false);
      setUserName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Registration failed"
      );
    }
  };

  // LOAD PROJECTS
  const loadProjects = async () => {
    try {
      const response = await api.get("/projects/");
      setProjects(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // CREATE PROJECT
  const createProject = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/projects/", {
        name,
        description,
        project_type: projectType,
      });

      setName("");
      setDescription("");
      setProjectType("");

      setMessage("Project created successfully!");

      loadProjects();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not create project"
      );
    }
  };

  // OPEN PROJECT
  const openProject = async (project) => {
    setSelectedProject(project);
    setMessage("");

    try {
      const response = await api.get(
        `/projects/${project.id}/sites/`
      );

      setSites(response.data);
    } catch (error) {
      console.error(error);
      setSites([]);
    }
  };

  // CREATE SITE
  const createSite = async () => {
    if (!siteName) {
      setMessage("Enter a site name first.");
      return;
    }

    if (!polygon) {
      setMessage("Draw a polygon on the map first.");
      return;
    }

    try {
      const response = await api.post(
        `/projects/${selectedProject.id}/sites/`,
        {
          name: siteName,
          geometry: polygon,
        }
      );

      setSites([...sites, response.data]);
      setSiteName("");
      setPolygon(null);

      setMessage("Site created successfully!");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not create site"
      );
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("access_token");

    setLoggedIn(false);
    setProjects([]);
    setSelectedProject(null);
    setSelectedSite(null);
  };

  useEffect(() => {
    if (loggedIn) {
      loadProjects();
    }
  }, [loggedIn]);

  // AUTH SCREEN
  if (!loggedIn) {
    return (
      <div style={pageStyle}>
        <div style={authCard}>
          <h1>🌍 Darukaa.Earth</h1>

          <p style={{ color: "#777" }}>
            Carbon & Biodiversity Analytics
          </p>

          {showRegister ? (
            <>
              <h2>Create Account</h2>

              <form onSubmit={register}>
                <input
                  style={inputStyle}
                  placeholder="Full name"
                  value={userName}
                  onChange={(e) =>
                    setUserName(e.target.value)
                  }
                  required
                />

                <input
                  style={inputStyle}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />

                <input
                  style={inputStyle}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

                <button style={primaryButton}>
                  Create Account
                </button>
              </form>

              <p>
                Already have an account?{" "}
                <button
                  style={linkButton}
                  onClick={() => {
                    setShowRegister(false);
                    setMessage("");
                  }}
                >
                  Login
                </button>
              </p>
            </>
          ) : (
            <>
              <h2>Login</h2>

              <form onSubmit={login}>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />

                <input
                  style={inputStyle}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

                <button style={primaryButton}>
                  Login
                </button>
              </form>

              <p>
                Don't have an account?{" "}
                <button
                  style={linkButton}
                  onClick={() => {
                    setShowRegister(true);
                    setMessage("");
                  }}
                >
                  Register
                </button>
              </p>
            </>
          )}

          {message && (
            <p style={{ marginTop: "20px" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // SITE ANALYTICS
  if (selectedSite) {
    return (
      <SiteAnalytics
        site={selectedSite}
        onBack={() => setSelectedSite(null)}
      />
    );
  }

  // PROJECT VIEW
  if (selectedProject) {
    return (
      <div style={pageStyleWide}>
        <button
          onClick={() => {
            setSelectedProject(null);
            setSites([]);
          }}
        >
          ← Back to Projects
        </button>

        <div style={headerStyle}>
          <div>
            <h1>{selectedProject.name}</h1>

            <p>
              {selectedProject.description}
            </p>
          </div>

          <button onClick={logout}>
            Logout
          </button>
        </div>

        <hr />

        <h2>Project Map</h2>

        <MapView
          onPolygonCreated={(geometry) =>
            setPolygon(geometry)
          }
        />

        <div style={cardStyle}>
          <h2>Add Site</h2>

          <input
            style={inputStyle}
            placeholder="Site name"
            value={siteName}
            onChange={(e) =>
              setSiteName(e.target.value)
            }
          />

          <button
            style={primaryButton}
            onClick={createSite}
          >
            Save Site
          </button>

          {message && <p>{message}</p>}
        </div>

        <h2>Project Sites</h2>

        {sites.length === 0 ? (
          <p>No sites yet.</p>
        ) : (
          sites.map((site) => (
            <div
              key={site.id}
              style={cardStyle}
            >
              <h3>{site.name}</h3>

              <p>
                Site ID: {site.id}
              </p>

              <p>
                Area:{" "}
                {site.area
                  ? `${(
                      site.area / 10000
                    ).toFixed(2)} hectares`
                  : "N/A"}
              </p>

              <button
                onClick={() =>
                  setSelectedSite(site)
                }
              >
                View Analytics
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  // DASHBOARD
  return (
    <div style={pageStyleWide}>
      <div style={headerStyle}>
        <div>
          <h1>🌍 Darukaa.Earth</h1>

          <p>
            Carbon & Biodiversity Analytics
          </p>
        </div>

        <button onClick={logout}>
          Logout
        </button>
      </div>

      <div style={cardStyle}>
        <h2>Create Project</h2>

        <form onSubmit={createProject}>
          <input
            style={inputStyle}
            placeholder="Project name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <textarea
            style={inputStyle}
            placeholder="Project description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          <input
            style={inputStyle}
            placeholder="Project type"
            value={projectType}
            onChange={(e) =>
              setProjectType(e.target.value)
            }
          />

          <button style={primaryButton}>
            Create Project
          </button>
        </form>

        {message && <p>{message}</p>}
      </div>

      <h2>My Projects</h2>

      {projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            style={cardStyle}
          >
            <h3>{project.name}</h3>

            <p>
              {project.description}
            </p>

            <p>
              Type: {project.project_type}
            </p>

            <button
              onClick={() =>
                openProject(project)
              }
            >
              Open Project
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "40px 20px",
  fontFamily: "Arial",
};

const pageStyleWide = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "30px",
  fontFamily: "Arial",
};

const authCard = {
  maxWidth: "450px",
  margin: "80px auto",
  padding: "35px",
  border: "1px solid #ddd",
  borderRadius: "16px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "25px",
  marginBottom: "20px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  boxSizing: "border-box",
};

const primaryButton = {
  padding: "12px 20px",
  cursor: "pointer",
};

const linkButton = {
  border: "none",
  background: "none",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
};

export default App;