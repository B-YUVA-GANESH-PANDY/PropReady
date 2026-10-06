import apiClient from '../api/client';

/**
 * Handles authenticated PDF report generation & blob download flow.
 * 1. Sends authenticated POST request to generate report.
 * 2. Sends authenticated GET request with responseType: 'blob' for PDF download.
 * 3. Creates object URL and triggers browser file download.
 * 4. Cleans up object URL and returns user-friendly status message + dev debug payload.
 */
export async function downloadAuthenticatedReport({
  propertyId,
  propertyTitle,
  onStart,
  onSuccess,
  onError
}) {
  if (onStart) onStart();

  let stage = "Report Generation Request";
  try {
    // 1. Generate Report
    stage = "Generating Report PDF";
    const genRes = await apiClient.post(`/properties/${propertyId}/reports/generate`);
    const reportId = genRes.data.report_id;

    // 2. Fetch PDF as Blob using authenticated client
    stage = "Downloading PDF File";
    const downloadUrl = `/properties/${propertyId}/reports/${reportId}/download`;
    const response = await apiClient.get(downloadUrl, {
      responseType: 'blob'
    });

    // 3. Clean filename formatting: PropReady_Property_Report_<property-name>.pdf
    stage = "Preparing Browser Download";
    const safeTitle = (propertyTitle || `Property_${propertyId}`).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const fileName = `PropReady_Property_Report_${safeTitle}.pdf`;

    // 4. Create Object URL and trigger browser download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Revoke object URL after delay
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);

    if (onSuccess) {
      onSuccess("Property report downloaded successfully.");
    }
  } catch (err) {
    let status = err.response?.status || 500;
    let url = err.config?.url || `/properties/${propertyId}/reports/download`;
    let backendDetail = err.message || "Unknown PDF download error";

    // Handle Blob error response parsing
    if (err.response?.data) {
      if (err.response.data instanceof Blob) {
        try {
          const blobText = await err.response.data.text();
          try {
            const parsedJson = JSON.parse(blobText);
            backendDetail = parsedJson.detail || parsedJson.message || blobText;
          } catch {
            backendDetail = blobText;
          }
        } catch {
          backendDetail = "Failed to parse error response Blob";
        }
      } else if (typeof err.response.data === 'object') {
        backendDetail = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data);
      }
    }

    console.error("PDF DOWNLOAD ERROR:", {
      status,
      url,
      stage,
      backendDetail,
      error: err
    });

    if (onError) {
      onError("Unable to generate the property report. Please try again.", {
        status,
        url,
        stage,
        detail: backendDetail
      });
    }
  }
}
