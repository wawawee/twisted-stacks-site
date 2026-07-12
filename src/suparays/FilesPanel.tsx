import React, { useCallback, useEffect, useRef, useState } from "react";

const MEMBER_LABELS: Record<string, string> = {
  baha: "Baha",
  kris: "Kris",
  joachim: "Joachim",
  per: "Per",
};

interface SharedFile {
  id: number;
  name: string;
  member: string;
  sizeBytes: number;
  contentType: string | null;
  createdAt: string;
  downloadUrl: string | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPanel() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/suparays/files");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte ladda filer");
      setFiles((data.files || []) as SharedFile[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Filfel");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const prep = await fetch("/api/suparays/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });
      const prepData = await prep.json();
      if (!prep.ok) throw new Error(prepData.error || "Kunde inte förbereda uppladdning");

      const putRes = await fetch(prepData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Uppladdning till lagring misslyckades");
      }

      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uppladdning misslyckades");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="suparays-files">
      <header className="suparays-files-header">
        <div>
          <h2>Delade filer</h2>
          <p>PDF, bilder, ljud, zip, markdown — max 25 MB. Större filer? Maila teamet.</p>
        </div>
        <div className="suparays-files-actions">
          <button type="button" className="suparays-btn" onClick={loadFiles} disabled={loading || uploading}>
            Uppdatera
          </button>
          <label className="suparays-btn suparays-btn-primary suparays-file-picker">
            {uploading ? "Laddar upp…" : "Ladda upp fil"}
            <input ref={inputRef} type="file" onChange={onPickFile} disabled={uploading} hidden />
          </label>
        </div>
      </header>

      {loading && files.length === 0 ? (
        <p className="suparays-loading">Laddar filer…</p>
      ) : files.length === 0 ? (
        <p className="suparays-files-empty">Inga filer ännu.</p>
      ) : (
        <ul className="suparays-files-list">
          {files.map((file) => (
            <li key={file.id} className="suparays-files-item">
              <div className="suparays-files-meta">
                <strong>{file.name}</strong>
                <span>
                  {MEMBER_LABELS[file.member] || file.member} · {formatBytes(file.sizeBytes)} ·{" "}
                  {new Date(file.createdAt).toLocaleString("sv-SE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {file.downloadUrl ? (
                <a href={file.downloadUrl} className="suparays-btn" download={file.name} target="_blank" rel="noreferrer">
                  Ladda ner
                </a>
              ) : (
                <span className="suparays-chat-hint">Länk saknas</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="suparays-error">{error}</p> : null}
    </div>
  );
}
