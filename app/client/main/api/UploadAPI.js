import API             from 'main/api/API';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import ajax            from 'main/util/ajax';
import Urls            from 'main/util/urls';

class UploadAPI extends API {
  constructor() {
    super('uploads');
  }

  createFromFile(file, file_name, multipart = true) {
    const attributes = {
      file_name: file_name,
      file_size: file.size,
      last_modified: Math.round(file.lastModified / 1000),
      is_multipart: multipart
    };

    return super.create({ attributes });
  }

  uploadPart(id, index, size, md5Hex) {
    const url = Urls.upload_part(id);

    const requestData = {
      data: {
        index,
        md5: md5Hex,
        size
      }
    };

    // This is a custom response format, think about returning an Upload object.
    return ajax.post(url, requestData);
  }

  complete(id) {
    const url = Urls.complete_upload(id);
    const response = ajax.post(url);

    response.done(payload => JsonAPIIngestor.ingest(payload));

    return response;
  }
}

export default new UploadAPI();
