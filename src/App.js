import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

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
      {/* <style>{styles}</style> */}

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
