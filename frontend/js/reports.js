import { callAI } from './api.js';
import { deleteReport, updateReportSummary, uploadReport } from './data.js';
import { MAX_REPORT_SIZE } from './config.js';
import { escapeHTML, formatAISummary, toast } from './utils.js';

export const reportState = { selected: null, uploading: false, analyzing: false };

export function reportsPage(state) {
  const reports = state.reports || [];
  const body = reports.length
    ? reports.map(r => `
      <tr class="border-b">
        <td class="p-4 font-medium">${escapeHTML(r.name)}</td>
        <td class="p-4">${escapeHTML(r.report_date)}</td>
        <td class="p-4"><span class="status-pill ${r.status === 'Analyzed' ? 'status-good' : 'status-new'}">${escapeHTML(r.status)}</span></td>
        <td class="p-4">
          <button class="text-accent mr-3 font-semibold" data-analyze="${r.id}">${r.summary ? 'View Summary' : 'Analyze'}</button>
          <button class="text-red-600 font-semibold" data-delete-report="${r.id}">Delete</button>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="4" class="p-8 text-center text-gray-500">No clinical reports yet.</td></tr>';

  return `
    <div class="page-wrap">
      <div class="page-heading">
        <div>
          <p class="eyebrow">CLINICAL DATA</p>
          <h1 class="page-title">Clinical Reports</h1>
          <p class="page-subtitle">Keep your reports organized and request an AI-assisted summary when you need one.</p>
        </div>
        <button data-nav="upload-report" class="btn-primary px-5 py-3 rounded-xl font-semibold">Upload New Report</button>
      </div>
      <div class="dashboard-card overflow-auto">
        <table class="w-full text-left">
          <thead><tr><th class="p-4">Report Name</th><th class="p-4">Date</th><th class="p-4">Status</th><th class="p-4">Actions</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function uploadPage() {
  const r = reportState.selected;
  return `
    <div class="page-wrap">
      <div class="page-heading">
        <div>
          <p class="eyebrow">PRIVATE DOCUMENTS</p>
          <h1 class="page-title">Upload New Clinical Report</h1>
          <p class="page-subtitle">Your file is stored in your private clinical-report area and is only accessible to your account.</p>
        </div>
      </div>
      <div class="dashboard-card p-8 max-w-2xl mx-auto">
        <div id="upload-box" class="upload-box">
          <input type="file" id="file-input" class="hidden" accept=".pdf,.jpg,.jpeg,.png"/>
          <div class="upload-icon">↑</div>
          <p class="mt-3 text-gray-600"><span class="font-semibold text-accent">Click to upload</span> or drag and drop</p>
          <p class="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
        </div>
        ${r ? `
          <div class="mt-6 p-5 border rounded-xl report-selected">
            <div class="flex items-start justify-between gap-4">
              <div><p class="font-semibold">${escapeHTML(r.name)}</p><p class="text-sm text-gray-500 mt-1">Stored securely in your private clinical-reports bucket.</p></div>
              <span class="status-pill ${r.summary ? 'status-good' : 'status-new'}">${r.summary ? 'Analyzed' : 'Ready'}</span>
            </div>
            <button id="analyze-uploaded" class="btn-primary w-full py-3 rounded-xl mt-4" ${reportState.analyzing ? 'disabled' : ''}>${reportState.analyzing ? 'Analyzing…' : 'Analyze with AI'}</button>
            ${r.summary ? `<div class="mt-5 ai-summary">${formatAISummary(r.summary)}</div>` : ''}
            <button data-nav="reports" class="w-full mt-4 bg-gray-100 py-3 rounded-xl font-semibold">Back to My Reports</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export async function handleUpload(file, state, render) {
  if (!file) return;
  if (file.size > MAX_REPORT_SIZE) return toast('File must be 10MB or smaller.', 'error');
  if (!['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) return toast('Only PDF, PNG and JPG reports are supported.', 'error');
  reportState.uploading = true;
  render();
  try {
    const r = await uploadReport(file);
    reportState.selected = r;
    state.reports = [r, ...(state.reports || [])];
    toast('Report uploaded securely.');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    reportState.uploading = false;
    render();
  }
}

export async function analyzeSelected(state, render) {
  const r = reportState.selected;
  if (!r) return;
  reportState.analyzing = true;
  render();
  try {
    const text = await callAI({ action: 'vision', storagePath: r.storage_path, mimeType: r.mime_type || 'application/octet-stream' });
    const updated = await updateReportSummary(r.id, text);
    reportState.selected = updated;
    state.reports = state.reports.map(x => x.id === updated.id ? updated : x);
    toast('AI analysis completed.');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    reportState.analyzing = false;
    render();
  }
}

export async function analyzeReportById(id, state, render) {
  const r = state.reports.find(x => x.id === id);
  if (!r) return;
  reportState.selected = r;
  if (r.summary) {
    window.__navigate('upload-report');
    return;
  }
  await analyzeSelected(state, render);
}

export async function removeReport(id, state, render) {
  const r = state.reports.find(x => x.id === id);
  if (!r || !confirm(`Delete ${r.name}?`)) return;
  try {
    await deleteReport(r);
    state.reports = state.reports.filter(x => x.id !== id);
    toast('Report deleted.');
    render();
  } catch (e) {
    toast(e.message, 'error');
  }
}
