import { useId, useRef, useState } from 'react';
import { Upload, FileText, Image, X } from 'lucide-react';

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const ACCEPTED_EXTENSIONS = '.pdf,.png,.jpg,.jpeg';
const MAX_SIZE_MB = 20;

interface FloorplanUploadProps {
  onUpload: (file: File, label: string, revisionNote?: string) => Promise<void>;
  /** Show a revision note field (for v2+ uploads). */
  showRevisionNote?: boolean;
  disabled?: boolean;
}

function fileIcon(type: string) {
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-[#b45309]" aria-hidden="true" />;
  return <Image className="w-5 h-5 text-[#2f6f4f]" aria-hidden="true" />;
}

export function FloorplanUpload({ onUpload, showRevisionNote = false, disabled = false }: FloorplanUploadProps) {
  const inputId = useId();
  const noteId = useId();
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(f: File): string | null {
    if (!ACCEPTED_TYPES.includes(f.type)) return 'Only PDF, PNG, or JPG files are supported.';
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB} MB.`;
    return null;
  }

  function selectFile(f: File) {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError(null);
    setFile(f);
    if (!label) setLabel(f.name.replace(/\.[^/.]+$/, ''));
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }

  function clearFile() {
    setFile(null);
    setLabel('');
    setRevisionNote('');
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || label.trim() === '') return;
    setError(null);
    setUploading(true);
    try {
      await onUpload(file, label.trim(), revisionNote.trim() || undefined);
      setFile(null);
      setLabel('');
      setRevisionNote('');
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const isDisabled = disabled || uploading;

  return (
    <form onSubmit={submit} aria-labelledby={labelId}>
      <h3 id={labelId} className="text-base font-semibold text-[#1c1a17] mb-3">
        Upload new version
      </h3>

      {!file ? (
        <div
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-label="Drop a floorplan file here or press Enter to browse"
          aria-disabled={isDisabled}
          onClick={() => !isDisabled && inputRef.current?.click()}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) inputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={isDisabled ? undefined : onDrop}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer
            ${dragOver ? 'border-[#2f6f4f] bg-[#e7f0eb]' : 'border-[#e3e0da] hover:border-[#2f6f4f] bg-[#f7f6f3] hover:bg-[#f0ede8]'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <Upload className="w-8 h-8 text-[#6b6560] mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-[#1c1a17]">Drop file here or click to browse</p>
          <p className="text-xs text-[#6b6560] mt-1">PDF, PNG, or JPG · max {MAX_SIZE_MB} MB</p>
        </div>
      ) : (
        <div className="border-2 border-[#e3e0da] rounded-2xl p-4 bg-white">
          <div className="flex items-center gap-3">
            {fileIcon(file.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1c1a17] truncate">{file.name}</p>
              <p className="text-xs text-[#6b6560]">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              disabled={isDisabled}
              aria-label="Remove selected file"
              className="p-1 rounded-lg hover:bg-[#f7f6f3] text-[#6b6560] disabled:opacity-40"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor={inputId} className="block text-xs font-semibold text-[#1c1a17] mb-1">
                Version label
              </label>
              <input
                id={inputId}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isDisabled}
                placeholder="e.g. 17ft Layout v3"
                required
                className="w-full px-3 py-2 text-sm border-2 border-[#e3e0da] rounded-xl focus:outline-none focus:border-[#2f6f4f] disabled:opacity-50 transition-colors"
              />
            </div>
            {showRevisionNote && (
              <div>
                <label htmlFor={noteId} className="block text-xs font-semibold text-[#1c1a17] mb-1">
                  Revision notes <span className="font-normal text-[#6b6560]">(optional)</span>
                </label>
                <textarea
                  id={noteId}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  disabled={isDisabled}
                  placeholder="Describe what changed in this version…"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border-2 border-[#e3e0da] rounded-xl focus:outline-none focus:border-[#2f6f4f] disabled:opacity-50 transition-colors resize-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={onInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p role="alert" className="text-sm text-[#b4231d] mt-2 font-medium">
          {error}
        </p>
      )}

      {file && (
        <button
          type="submit"
          disabled={isDisabled || label.trim() === ''}
          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          {uploading ? 'Uploading…' : 'Upload floorplan'}
        </button>
      )}
    </form>
  );
}
