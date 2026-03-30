import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const emptyForm = {
  name: "",
  repository: "",
  version: "",
};

export default function App() {
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const loadModels = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/models");
      setModels(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load models."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name.trim(),
        repository: form.repository.trim(),
        version: form.version.trim(),
      };

      if (!payload.name || !payload.repository || !payload.version) {
        throw new Error("All fields are required.");
      }

      if (isEditing) {
        await api.put(`/models?id=${editingId}`, payload);
        setSuccess("Model updated successfully.");
      } else {
        await api.post("/models", payload);
        setSuccess("Model created successfully.");
      }

      resetForm();
      await loadModels();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save model."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (model) => {
    setForm({
      name: model.name ?? "",
      repository: model.repository ?? "",
      version: model.version ?? "",
    });
    setEditingId(model.id);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this model?");
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/models?id=${id}`);
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Model deleted successfully.");
      await loadModels();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete model."));
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="page">
        <div className="container">
          <header className="header">
            <div>
              <h1>Models Dashboard</h1>
              <p>List, add, update, and delete models.</p>
            </div>
            <button className="button button-secondary" onClick={loadModels} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          <section className="card form-card">
            <h2>{isEditing ? `Edit Model #${editingId}` : "Add Model"}</h2>

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="example-service"
                />
              </div>

              <div className="field">
                <label htmlFor="repository">Repository</label>
                <input
                  id="repository"
                  name="repository"
                  type="text"
                  value={form.repository}
                  onChange={handleChange}
                  placeholder="github.com/org/repo"
                />
              </div>

              <div className="field">
                <label htmlFor="version">Version</label>
                <input
                  id="version"
                  name="version"
                  type="text"
                  value={form.version}
                  onChange={handleChange}
                  placeholder="v0.1.0"
                />
              </div>

              <div className="actions">
                <button className="button" type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : isEditing ? "Update Model" : "Create Model"}
                </button>
                <button className="button button-secondary" type="button" onClick={resetForm}>
                  Clear
                </button>
              </div>
            </form>
          </section>

          {(error || success) && (
            <div className="messages">
              {error ? <div className="alert alert-error">{error}</div> : null}
              {success ? <div className="alert alert-success">{success}</div> : null}
            </div>
          )}

          <section className="card table-card">
            <div className="table-header">
              <h2>Models</h2>
              <span className="badge">{models.length} total</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Repository</th>
                    <th>Version</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && models.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        No models found.
                      </td>
                    </tr>
                  ) : (
                    models.map((model) => (
                      <tr key={model.id}>
                        <td>{model.id}</td>
                        <td>{model.name}</td>
                        <td>
                          <span className="repo-text">{model.repository}</span>
                        </td>
                        <td>{model.version}</td>
                        <td>
                          <div className="row-actions">
                            <button className="button button-small" onClick={() => handleEdit(model)}>
                              Edit
                            </button>
                            <button
                              className="button button-small button-danger"
                              onClick={() => handleDelete(model.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function getErrorMessage(error, fallback) {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === "string") return error.response.data;
  if (error.message) return error.message;
  return fallback;
}

const styles = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    color: #0f172a;
  }

  button,
  input {
    font: inherit;
  }

  .page {
    min-height: 100vh;
    padding: 32px 16px;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }

  .header h1 {
    margin: 0 0 6px;
    font-size: 2rem;
  }

  .header p {
    margin: 0;
    color: #475569;
  }

  .card {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 18px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    padding: 20px;
    margin-bottom: 20px;
  }

  .form-card h2,
  .table-card h2 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 1.15rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    align-items: end;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field label {
    font-size: 0.92rem;
    font-weight: 600;
    color: #334155;
  }

  .field input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    background: #fff;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .field input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .button {
    border: none;
    border-radius: 12px;
    padding: 11px 16px;
    cursor: pointer;
    background: #4f46e5;
    color: white;
    font-weight: 600;
    transition: transform 0.15s ease, opacity 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.22);
  }

  .button:hover {
    transform: translateY(-1px);
  }

  .button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .button-secondary {
    background: #e2e8f0;
    color: #0f172a;
    box-shadow: none;
  }

  .button-danger {
    background: #dc2626;
    box-shadow: none;
  }

  .button-small {
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .messages {
    display: grid;
    gap: 10px;
    margin-bottom: 20px;
  }

  .alert {
    padding: 12px 14px;
    border-radius: 12px;
    font-weight: 500;
  }

  .alert-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .alert-success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4338ca;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 760px;
  }

  th,
  td {
    text-align: left;
    padding: 14px 12px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }

  th {
    font-size: 0.86rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
  }

  tbody tr:hover {
    background: rgba(99, 102, 241, 0.04);
  }

  .repo-text {
    word-break: break-all;
    color: #334155;
  }

  .row-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .empty-state {
    text-align: center;
    color: #64748b;
    padding: 28px 12px;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      align-items: stretch;
    }

    .actions {
      grid-column: 1 / -1;
    }
  }
`;
