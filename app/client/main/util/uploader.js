import $        from 'jquery';
import _        from 'lodash';
import SparkMD5 from 'spark-md5';

import NotificationActions from 'main/actions/NotificationActions';
import UploadAPI           from 'main/api/UploadAPI';
import Semaphore           from 'main/util/Semaphore';
import ajax                from 'main/util/ajax';

/*
  AWS S3 encourages you to use multipart upload for anything over 5mb.
  We try to limit the max size of our uploads to 10gb.

  https://aws.amazon.com/s3/faqs/
*/
const DEFAULT_PART_SIZE = (2 ** 20) * 8; // 1mb in bits
const MAX_PARTS = 10000; // Enforced by the server. 10gb if each part is the default size.
const PARALLELISM = 6;

// Forces serialization of create upload requests
// such that files get uploaded in the selected order
const createUploadQueue = new Semaphore(1);

// A queue that manages how many file parts are being uploaded in parallel
const uploadQueue = new Semaphore(PARALLELISM);

/*
  This uploads files using a multi-part upload approach.
  It uses our Upload api to manage the state of uploads and to get
  presigned urls to upload data to (typically this would be an S3 url).
*/
class FileUploader {
  constructor(file, filename, multipart = true) {
    this.file                 = file;
    this.filename             = filename;
    this.multipart            = multipart;
    this.globalProgress       = ajax.Deferred();
    this.globalProgress.abort = () => this.abort();

    this.bytesUploaded = 0;
    this.totalBytes = this.file.size;

    this.partSize = Math.max(Math.ceil(this.totalBytes / MAX_PARTS), DEFAULT_PART_SIZE);
    this.numParts = Math.max(1, Math.ceil(this.totalBytes / this.partSize));

    this.partQueue = [];
    this.bytesUploadedPerPart = {};

    this.maxRetries = 4;

    // Keeps track of part failures, to prevent infinite retries. Maps a part index to
    // failure count for that part
    this.failCounts = {};

    // Map from part id to {etag: "", size: 0}
    this.existingPartInfo = {};

    // A mapping from upload part index to uploader. Null values indicate that the
    // upload is no longer in progress
    this.uploadsInProgress = {};

    for (let i = 0; i < this.numParts; i += 1) {
      const start = this.partSize * i;
      const part = {
        index: i + 1,
        start,
        stop: Math.min(this.totalBytes, start + this.partSize)
      };

      this.partQueue.push(part);
      this.bytesUploadedPerPart[part.index] = 0;
    }
  }

  start() {
    return createUploadQueue.acquire().done((token) => {
      return this.createUpload()
        .always(() => createUploadQueue.release(token))
        .fail(this.makeErrorHandler('create upload'))
        .done(() => {
          if (this.multipart) {
            // Uploads in parts by asking webapp for a url for each part
            // then posts to AWS
            // then completes upload in webapp

            // Remove any already done parts from the part queue
            this.partQueue = _.reject(this.partQueue, (part) => {
              const existingPart = this.existingPartInfo[part.index];

              if (existingPart && existingPart.size === part.stop - part.start) {
                this.bytesUploadedPerPart[part.index] = existingPart.size;
                return true;
              } else {
                return false;
              }
            });

            // Now start the fun!
            this.uploadFileByParts()
              .fail(this.makeErrorHandler('upload file by parts'))
              .done(() => {
                this.completeUpload()
                  .fail(this.makeErrorHandler('upload file by parts', this.globalProgress))
                  .done(resp => this.globalProgress.resolve({
                    key: resp.data.attributes.key,
                    url: resp.data.attributes.url,
                    id: resp.data.id
                  }));
              });
          } else {
            $.ajax({
              type: 'PUT',
              url: this.uploadUrl,
              contentType: 'binary/octet-stream',
              processData: false,
              data: this.file
            })
              .fail(this.makeErrorHandler('upload file', this.globalProgress))
              .done((_resp) => {
                this.globalProgress.resolve({ url: this.url, id: this.uploadID, key: this.key });
              });
          }
        });
    });
  }

  abort() {
    this.aborted = true;
    const progress = ajax.Deferred();
    for (let i = 0; i < this.numParts; i += 1) {
      this.bytesUploadedPerPart[i] = 0;
    }

    this.partQueue = [];

    Object.keys(this.uploadsInProgress).forEach(key =>
      this.uploadsInProgress[key].abort()
    );

    this.uploadsInProgress = {};

    if (this.uploadID) {
      UploadAPI.destroy(this.uploadID)
        .done(() => progress.resolve())
        .fail(() => progress.reject());
    } else {
      progress.resolve();
    }

    return progress;
  }

  percentDone() {
    const totalBytesUploaded = _.reduce(_.values(this.bytesUploadedPerPart), (sum, v) => sum + v, 0);
    return Math.floor(100 * (totalBytesUploaded / this.totalBytes));
  }

  // eslint-disable-next-line class-methods-use-this
  makeErrorHandler(stepName, status) {
    return (error) => {
      const msg = `Failed to ${stepName}: ${error}`;

      NotificationActions.createNotification({
        text: msg,
        isError: true
      });

      if (status) {
        status.reject(msg);
      }
    };
  }

  createUpload() {
    return UploadAPI.createFromFile(this.file, this.filename, this.multipart)
      .done((resp) => {
        this.key              = resp.data.attributes.key;
        this.uploadID         = resp.data.id;
        this.url              = resp.data.attributes.url; // if non-multipart, a single shot url to read the upload.
        this.uploadUrl        = resp.data.attributes.upload_url; // if non-multipart, a single shot url to post to.
        this.existingPartInfo = resp.data.attributes.upload_parts; // if multipart parts we have completed
      });
  }

  completeUpload() {
    return UploadAPI.complete(this.uploadID);
  }

  // eslint-disable-next-line class-methods-use-this
  computeMD5(slice) {
    const result = ajax.Deferred();

    const fileReader = new FileReader();

    fileReader.onerror = _e =>
      result.reject('An error occurred computing checksum of file slice');

    fileReader.onload = (e) => {
      const md5 = SparkMD5.ArrayBuffer.hash(e.target.result);
      return result.resolve(md5);
    };

    fileReader.readAsArrayBuffer(slice);

    return result;
  }

  makePartUploadURL(part, md5Hex) {
    const partSize = part.stop - part.start;
    return UploadAPI.uploadPart(this.uploadID, part.index, partSize, md5Hex);
  }

  uploadPart(part) {
    const progress = ajax.Deferred();

    const slicer = this.file.slice || this.file.webkitSlice || this.file.mozSlice;
    const slice  = slicer.call(this.file, part.start, part.stop);

    this.computeMD5(slice)
      .fail(this.makeErrorHandler('computing checksum of file slice', progress))
      .done((md5Hex) => {
        this.makePartUploadURL(part, md5Hex)
          .fail(() => progress.reject())
          .done((resp) => {
            const headers = { ...resp.headers };

            const uploadCall = $.ajax({
              url: resp.url,
              headers,
              method: 'PUT',
              contentType: 'binary/octet-stream',
              processData: false,
              data: slice,
              error: (_jqXHR, _status, _e) => {
                this.bytesUploadedPerPart[part.index] = 0;

                this.globalProgress.notify({
                  percentDone: this.percentDone()
                });

                if (this.failCounts[part.index] == undefined) {
                  this.failCounts[part.index] = 0;
                }

                this.failCounts[part.index] += 1;

                if (this.failCounts[part.index] >= this.maxRetries || this.aborted) {
                  progress.reject(`Failed to upload part ${part.index}`);
                } else {
                  // Try again later, and chain the deferred objects
                  const timeoutFn = () => {
                    this.uploadPart(part)
                      .done(() => progress.resolve(part))
                      .fail(msg => progress.reject(msg));
                  };

                  const delay = (2 ** this.failCounts[part.index]) * 1000;

                  setTimeout(timeoutFn, delay);
                }
              },

              success: (_data, _status) => {
                return progress.resolve(part);
              },

              xhr: () => {
                let doneHandler;
                const xhr = $.ajaxSettings.xhr();

                if (xhr.upload != undefined) {
                  const progressHandler = (e) => {
                    if (!this.aborted && e.lengthComputable) {
                      this.bytesUploadedPerPart[part.index] = e.loaded;
                      this.globalProgress.notify({
                        percentDone: this.percentDone()
                      });
                    }
                  };

                  doneHandler = () => {
                    if (!this.aborted) {
                      this.bytesUploadedPerPart[part.index] = part.stop - part.start;
                    }

                    // Clean up event listeners
                    xhr.upload.removeEventListener('progress', progressHandler);
                    return xhr.upload.removeEventListener('loadend', doneHandler);
                  };

                  xhr.upload.addEventListener('progress', progressHandler);
                  xhr.upload.addEventListener('loadend', doneHandler);
                }

                return xhr;
              }
            });

            progress.abort = () => {
              this.globalProgress.notify({
                percentDone: 0
              });

              uploadCall.abort();
            };
          });
      });

    return progress;
  }

  uploadFileByParts() {
    const progress = ajax.Deferred();
    let doneCount = 0;

    const uploadPart = (part) => {
      uploadQueue.acquire().done((uploadToken) => {
        if (this.aborted) {
          uploadQueue.release(uploadToken);
          return;
        }

        const partUploader = this.uploadPart(part)
          .fail(() => {
            if (!this.aborted) {
              progress.reject(`Failed to upload part ${part.index}, after multiple attempts`);
            }
          })
          .done(() => {
            doneCount += 1;
            if (doneCount === this.partQueue.length) {
              progress.resolve();
            }
          })
          .always(() => {
            uploadQueue.release(uploadToken);
            delete this.uploadsInProgress[part.index];
          });

        this.uploadsInProgress[part.index] = partUploader;
      });
    };

    if (this.partQueue.length === 0) {
      // handle the case when there are no parts, we should resolve
      progress.resolve();
    } else {
      // actually do the uploading.
      this.partQueue.forEach(uploadPart);
    }

    return progress;
  }
}

/*
 * Returns a jquery deferred object with the following behavior
 *   done: Will be triggered when the upload is complete
 *   fail: Will be triggered if the upload fails
 *   progress: Will be triggered for file upload progress
 *
 * This deferred object also has a patched in abort method
 *
 * Resolves with an object having the keys 'url' and 'key'
 */
const uploadFile = function(file, filename, multipart = true) {
  const uploader = new FileUploader(file, filename, multipart);
  uploader.start();
  return uploader.globalProgress;
};

// eslint-disable-next-line import/prefer-default-export
export { uploadFile };
