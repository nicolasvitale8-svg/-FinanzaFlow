
/**
 * Google Drive Sync Service
 * Gestiona la persistencia en el Drive del usuario con Client ID configurable.
 */

const FILE_NAME = 'finanzaflow_db_v2.json';
let accessToken: string | null = null;

export const GoogleDriveService = {
  setAccessToken: (token: string) => {
    accessToken = token;
    localStorage.setItem('ff_google_token', token);
  },

  getAccessToken: () => accessToken || localStorage.getItem('ff_google_token'),

  setClientId: (id: string) => {
    localStorage.setItem('ff_google_client_id', id);
  },

  getClientId: () => localStorage.getItem('ff_google_client_id') || '',

  // Busca el archivo en Drive, si no existe lo crea
  syncFile: async (dataToSave?: any) => {
    const token = GoogleDriveService.getAccessToken();
    if (!token) return null;

    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed = false&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (searchRes.status === 401) {
        GoogleDriveService.logout();
        return null;
      }

      const { files } = await searchRes.json();
      let fileId = files && files.length > 0 ? files[0].id : null;

      if (dataToSave) {
        const metadata = { name: FILE_NAME, mimeType: 'application/json' };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(dataToSave)], { type: 'application/json' }));

        const url = fileId 
          ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
          : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
        
        const method = fileId ? 'PATCH' : 'POST';

        await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        return dataToSave;
      } else {
        if (!fileId) return null;
        const fileRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return await fileRes.json();
      }
    } catch (e) {
      console.error("Error en Google Drive Sync:", e);
      return null;
    }
  },

  logout: () => {
    accessToken = null;
    localStorage.removeItem('ff_google_token');
  }
};
