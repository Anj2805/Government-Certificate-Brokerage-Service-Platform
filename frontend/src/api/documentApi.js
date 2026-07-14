import httpClient from './httpClient';

export const documentApi = {
  async uploadDocument(formData, onUploadProgress) {
    const { data } = await httpClient.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return data.data.document;
  },
  async listDocuments(params = {}) {
    const { data } = await httpClient.get('/documents', { params });
    return data;
  },
  async getDocumentMetadata(id) {
    const { data } = await httpClient.get(`/documents/${id}`);
    return data.data.document;
  },
  async deleteDocument(id) {
    const { data } = await httpClient.delete(`/documents/${id}`);
    return data;
  },
  downloadDocument: (documentId) => httpClient.get(`/documents/${documentId}/download?json=true`)
};
