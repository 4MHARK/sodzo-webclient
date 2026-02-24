import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

interface SubmissionRecord {
  _id: string;
  submissionId?: string;
  status: string;
  submittedAt?: string;
  submissionData: Record<string, any>;
}

export default function ModuleSubmissions() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState("Module");
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [editing, setEditing] = useState<SubmissionRecord | null>(null);
  const [editJson, setEditJson] = useState("");
  const [editStatus, setEditStatus] = useState("submitted");

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectRes, submissionsRes] = await Promise.all([
        api.get(`/project-forms/project/${projectId}`),
        api.get(`/form-submissions/project/${projectId}?sortBy=submittedAt:desc&limit=100`),
      ]);

      setProjectName(projectRes?.data?.configuration?.projectName || "Module");
      setSubmissions(submissionsRes?.data?.results || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const submissionRows = useMemo(
    () =>
      submissions.map((item) => ({
        ...item,
        createdLabel: item.submittedAt
          ? new Date(item.submittedAt).toLocaleString()
          : "-",
      })),
    [submissions]
  );

  const openEdit = (submission: SubmissionRecord) => {
    setEditing(submission);
    setEditStatus(submission.status || "submitted");
    setEditJson(JSON.stringify(submission.submissionData || {}, null, 2));
  };

  const closeEdit = () => {
    setEditing(null);
    setEditJson("");
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      const parsed = JSON.parse(editJson || "{}");
      await api.patch(`/form-submissions/${editing._id}`, {
        submissionData: parsed,
        status: editStatus,
        notes: "Updated from sabyWeb submissions manager",
      });
      toast.success("Submission updated");
      closeEdit();
      await loadData();
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        toast.error("Submission JSON is invalid");
      } else {
        toast.error(error?.response?.data?.message || "Failed to update submission");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (submission: SubmissionRecord) => {
    const confirmed = window.confirm("Delete this submission?");
    if (!confirmed) return;
    try {
      await api.delete(`/form-submissions/${submission._id}`);
      toast.success("Submission deleted");
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete submission");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {projectName} Submissions
          </h1>
          <p className="text-sm text-gray-500">
            View, edit, and delete module submissions.
          </p>
        </div>
        <button
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Modules
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Submission
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Submitted At
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {submissionRows.map((submission) => (
              <tr key={submission._id}>
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                  {submission.submissionId || submission._id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {submission.status}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {submission.createdLabel}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(submission)}
                      className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      title="Edit submission"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(submission)}
                      className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                      title="Delete submission"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {submissionRows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  No submissions found for this module.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Edit Submission
            </h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="submitted">submitted</option>
                <option value="processing">processing</option>
                <option value="completed">completed</option>
                <option value="failed">failed</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Submission Data (JSON)
              </label>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                rows={14}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeEdit}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
