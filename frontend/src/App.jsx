import { useEffect, useState } from "react";
import axios from "axios";
import MapView from "./MapView";
import SiteAnalytics from "./SiteAnalytics";
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };
  const passwordRequirements = {
    minLength: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordValid =
    passwordRequirements.minLength &&
    passwordRequirements.uppercase &&
    passwordRequirements.lowercase &&
    passwordRequirements.special;
  // LOGIN
  const login = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("access_token", response.data.access_token);

      setLoggedIn(true);
      setMessage("Login successful!");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Login failed");
    }
  };

  // REGISTER
  const register = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!passwordValid) {
      setMessage("Please meet all password requirements.");
      return;
    }

    try {
      await axios.post(`${API}/auth/register`, {
        name: userName,
        email,
        password,
      });

      setMessage("Registration successful! Please login.");

      setShowRegister(false);
      setUserName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Registration failed");
    }
  };

  // CREATE PROJECT
  const createProject = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${API}/projects/`,
        {
          name,
          description,
          project_type: projectType,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setName("");
      setDescription("");
      setProjectType("");

      setMessage("Project created successfully!");

      // Reload projects after creating one.
      const response = await axios.get(`${API}/projects/`, {
        headers: getAuthHeaders(),
      });

      setProjects(response.data);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not create project");
    }
  };

  // OPEN PROJECT
  const openProject = async (project) => {
    setSelectedProject(project);
    setSelectedSite(null);
    setMessage("");

    try {
      const response = await axios.get(`${API}/projects/${project.id}/sites/`, {
        headers: getAuthHeaders(),
      });

      setSites(response.data);
    } catch (error) {
      console.error(error);
      setSites([]);
    }
  };

  // CREATE SITE
  const createSite = async () => {
    if (!siteName.trim()) {
      setMessage("Enter a site name first.");
      return;
    }

    if (!polygon) {
      setMessage("Draw a polygon on the map first.");
      return;
    }

    if (!selectedProject) {
      setMessage("No project selected.");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/projects/${selectedProject.id}/sites/`,
        {
          name: siteName,
          geometry: polygon,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setSites((currentSites) => [...currentSites, response.data]);

      setSiteName("");
      setPolygon(null);

      setMessage("Site created successfully!");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not create site");
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("access_token");

    setLoggedIn(false);
    setProjects([]);
    setSelectedProject(null);
    setSelectedSite(null);
    setSites([]);
    setPolygon(null);
    setMessage("");
  };

  // LOAD PROJECTS WHEN USER LOGS IN
  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    const loadProjects = async () => {
      try {
        const response = await axios.get(`${API}/projects/`, {
          headers: getAuthHeaders(),
        });

        setProjects(response.data);
      } catch (error) {
        console.error(error);

        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          setLoggedIn(false);
        }
      }
    };

    loadProjects();
  }, [loggedIn]);

  // AUTH SCREEN
  // AUTH SCREEN
  if (!loggedIn) {
    return (
      <div style={authPageStyle}>
        {/* LEFT SIDE */}
        <div style={authLeftStyle}>
          <div>
            <h1 style={authBrandStyle}>🌍 Darukaa.Earth</h1>

            <h2 style={authTaglineStyle}>Carbon & Biodiversity Analytics</h2>

            <p style={authDescriptionStyle}>
              A geospatial platform for managing environmental projects,
              geographical sites and performance analytics.
            </p>

            <div style={authFeaturesStyle}>
              <p>🌍 Interactive geospatial mapping</p>
              <p>🌱 Carbon & biodiversity monitoring</p>
              <p>📊 Site performance analytics</p>
              <p>📍 Project and site management</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={authRightStyle}>
          <div style={authCard}>
            {showRegister ? (
              <>
                <h2>Create Account</h2>

                <form onSubmit={register}>
                  <input
                    style={inputStyle}
                    placeholder="Full name"
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}
                    required
                  />

                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />

                  <input
                    style={{
                      ...inputStyle,
                      border: `2px solid ${
                        passwordValid ? "#22c55e" : "#ef4444"
                      }`,
                      outline: "none",
                    }}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <div style={passwordRequirementsStyle}>
                    <p
                      style={{
                        color: passwordRequirements.minLength
                          ? "#22c55e"
                          : "#ef4444",
                      }}
                    >
                      {passwordRequirements.minLength ? "✓" : "✗"} At least 6
                      characters
                    </p>

                    <p
                      style={{
                        color: passwordRequirements.uppercase
                          ? "#22c55e"
                          : "#ef4444",
                      }}
                    >
                      {passwordRequirements.uppercase ? "✓" : "✗"} One uppercase
                      letter
                    </p>

                    <p
                      style={{
                        color: passwordRequirements.lowercase
                          ? "#22c55e"
                          : "#ef4444",
                      }}
                    >
                      {passwordRequirements.lowercase ? "✓" : "✗"} One lowercase
                      letter
                    </p>

                    <p
                      style={{
                        color: passwordRequirements.special
                          ? "#22c55e"
                          : "#ef4444",
                      }}
                    >
                      {passwordRequirements.special ? "✓" : "✗"} One special
                      character
                    </p>
                  </div>

                  <button type="submit" style={primaryButton}>
                    Create Account
                  </button>
                </form>

                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
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
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />

                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button type="submit" style={primaryButton}>
                    Login
                  </button>
                </form>

                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
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

            {message && <p style={{ marginTop: "20px" }}>{message}</p>}
          </div>
        </div>
      </div>
    );
  }
  // SITE ANALYTICS
  if (selectedSite) {
    return (
      <SiteAnalytics site={selectedSite} onBack={() => setSelectedSite(null)} />
    );
  }

  // PROJECT VIEW
  // PROJECT VIEW
  if (selectedProject) {
    return (
      <div style={projectPageStyle}>
        <div style={projectTopBar}>
          <button
            type="button"
            onClick={() => {
              setSelectedProject(null);
              setSelectedSite(null);
              setSites([]);
              setPolygon(null);
              setMessage("");
            }}
            style={backButtonStyle}
          >
            ← Back to Projects
          </button>

          <button type="button" onClick={logout} style={logoutButtonStyle}>
            Logout
          </button>
        </div>

        <div style={projectHeaderStyle}>
          <h1>{selectedProject.name}</h1>

          <p>{selectedProject.description || "Environmental project"}</p>

          <span style={projectTypeBadge}>{selectedProject.project_type}</span>
        </div>

        <div style={projectLayoutStyle}>
          {/* LEFT: MAP */}
          <div style={mapPanelStyle}>
            <div style={sectionHeaderStyle}>
              <h2>Project Map</h2>

              <p>Draw a polygon on the map to create a geographical site.</p>
            </div>

            <div style={mapWrapperStyle}>
              <MapView
                sites={sites}
                onPolygonCreated={(geometry) => setPolygon(geometry)}
              />
            </div>
          </div>

          {/* RIGHT: PROJECT CONTROLS */}
          <div style={sidePanelStyle}>
            {/* ADD SITE */}
            <div style={sideCardStyle}>
              <h2>Add Site</h2>

              <p style={mutedTextStyle}>
                Draw an area on the map, then give the site a name and save it.
              </p>

              <input
                style={inputStyle}
                placeholder="Site name"
                value={siteName}
                onChange={(event) => setSiteName(event.target.value)}
              />

              <button type="button" style={primaryButton} onClick={createSite}>
                Save Site
              </button>

              {message && <p style={{ marginTop: "15px" }}>{message}</p>}
            </div>

            {/* SITES */}
            <div style={sideCardStyle}>
              <div style={sitesHeaderStyle}>
                <h2>Project Sites</h2>

                <span style={siteCountStyle}>{sites.length}</span>
              </div>

              {sites.length === 0 ? (
                <div style={emptySitesStyle}>
                  <p>No sites yet.</p>
                  <p style={mutedTextStyle}>Draw your first site on the map.</p>
                </div>
              ) : (
                <div>
                  {sites.map((site) => (
                    <div key={site.id} style={siteCardStyle}>
                      <div>
                        <h3>{site.name}</h3>

                        <p style={mutedTextStyle}>Site ID: {site.id}</p>

                        <p style={mutedTextStyle}>
                          Area:{" "}
                          {site.area
                            ? `${(site.area / 10000).toFixed(2)} hectares`
                            : "N/A"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSite(site)}
                        style={analyticsButtonStyle}
                      >
                        View Analytics →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  // DASHBOARD
  return (
    <div style={pageStyleWide}>
      <div style={headerStyle}>
        <div>
          <h1>🌍 Darukaa.Earth</h1>

          <p>Carbon & Biodiversity Analytics</p>
        </div>

        <button type="button" onClick={logout}>
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
            onChange={(event) => setName(event.target.value)}
            required
          />

          <textarea
            style={inputStyle}
            placeholder="Project description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <input
            style={inputStyle}
            placeholder="Project type"
            value={projectType}
            onChange={(event) => setProjectType(event.target.value)}
          />

          <button type="submit" style={primaryButton}>
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
          <div key={project.id} style={cardStyle}>
            <h3>{project.name}</h3>

            <p>{project.description}</p>

            <p>Type: {project.project_type}</p>

            <button type="button" onClick={() => openProject(project)}>
              Open Project
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// const pageStyle = {
//   minHeight: "100vh",
//   padding: "40px 20px",
//   fontFamily: "Arial",
// };

const pageStyleWide = {
  width: "100%",
  margin: "0",
  padding: "30px",
  boxSizing: "border-box",
  fontFamily: "Arial",
};
const projectPageStyle = {
  minHeight: "100vh",
  width: "100%",
  padding: "25px 35px",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const projectTopBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
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

const logoutButtonStyle = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #555",
  background: "#222",
  color: "#fff",
  cursor: "pointer",
};

const projectHeaderStyle = {
  marginBottom: "25px",
};

const projectTypeBadge = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "20px",
  background: "#333",
  fontSize: "13px",
  marginTop: "5px",
};

const projectLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "25px",
  alignItems: "stretch",
  width: "100%",
};

const mapPanelStyle = {
  border: "1px solid #444",
  borderRadius: "14px",
  padding: "18px",
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle = {
  marginBottom: "15px",
};

const mapWrapperStyle = {
  width: "100%",
  height: "calc(100vh - 250px)",
  minHeight: "600px",
  borderRadius: "12px",
  overflow: "hidden",
};

const sidePanelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  minWidth: 0,
  width: "100%",
};

const sideCardStyle = {
  border: "1px solid #444",
  borderRadius: "14px",
  padding: "22px",
};

const mutedTextStyle = {
  color: "#999",
  fontSize: "14px",
};

const sitesHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "15px",
};

const siteCountStyle = {
  minWidth: "28px",
  height: "28px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#333",
  fontSize: "13px",
};

const siteCardStyle = {
  border: "1px solid #444",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "12px",
};

const analyticsButtonStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "7px",
  border: "1px solid #555",
  background: "#333",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "600",
};

const emptySitesStyle = {
  padding: "20px 5px",
  textAlign: "center",
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

const passwordRequirementsStyle = {
  marginTop: "-8px",
  marginBottom: "15px",
  fontSize: "13px",
  textAlign: "left",
};

const primaryButton = {
  padding: "12px 20px",
  cursor: "pointer",
};

const authPageStyle = {
  minHeight: "100vh",
  width: "100%",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
};

const authLeftStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "70px",
  boxSizing: "border-box",
};

const authRightStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "50px",
  boxSizing: "border-box",
};

const authBrandStyle = {
  fontSize: "52px",
  marginBottom: "15px",
};

const authTaglineStyle = {
  fontSize: "26px",
  fontWeight: "400",
  color: "#aaa",
};

const authDescriptionStyle = {
  maxWidth: "500px",
  fontSize: "18px",
  lineHeight: "1.7",
  color: "#999",
  marginTop: "25px",
};

const authFeaturesStyle = {
  marginTop: "35px",
  color: "#aaa",
  lineHeight: "2",
};

const authCard = {
  width: "100%",
  maxWidth: "450px",
  padding: "40px",
  border: "1px solid #555",
  borderRadius: "16px",
  boxSizing: "border-box",
};
const linkButton = {
  border: "none",
  background: "none",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
};

export default App;
