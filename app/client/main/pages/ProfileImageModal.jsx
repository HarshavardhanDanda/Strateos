import React                         from 'react';
import ReactCrop, { makeAspectCrop } from 'react-image-crop';
import _                             from 'lodash';
import Pica                          from 'pica/dist/pica.min';
import PropTypes                     from 'prop-types';

import UserActions                           from 'main/actions/UserActions';
import { SinglePaneModal }                   from 'main/components/Modal';
import FileUtil                              from 'main/util/FileUtil';
import { uploadFile }                        from 'main/util/uploader';
import OrganizationActions                   from 'main/actions/OrganizationActions';
import { Banner, DragDropFilePicker }        from '@transcriptic/amino';

class ProfileImageModal extends React.Component {
  static get propTypes() {
    return {
      match: PropTypes.shape({
        path: PropTypes.string,
        params: PropTypes.shape({
          subdomain: PropTypes.string
        })
      }),
      userId:   PropTypes.string,
      onResize: PropTypes.func.isRequired,
      type:     PropTypes.string.isRequired
    };
  }

  static get modalId() {
    return 'UserProfileImageModal';
  }

  constructor(props, context) {
    super(props, context);

    this.onSelectFile  = this.onSelectFile.bind(this);
    this.onCropChange  = this.onCropChange.bind(this);
    this.onImageLoaded = this.onImageLoaded.bind(this);
    this.onImageError  = this.onImageError.bind(this);
    this.cropImage     = this.cropImage.bind(this);
    this.resizeImage   = this.resizeImage.bind(this);
    this.onClearError  = this.onClearError.bind(this);
    this.abortUpload   = this.abortUpload.bind(this);

    this.state = this.initialState();
  }

  initialState() {
    return {
      // file object that the user selects
      imageFile: undefined,

      // image data read by FileReader and passed to ReactCrop src
      imageSrc: undefined,

      // image object loaded by ReactCrop
      image: undefined,

      // Was there an error during conversion
      error: false,

      crop: {
        x: 0,
        y: 0,
        width: 100,
        aspect: 1
      },
      file: undefined
    };
  }

  onSelectFile(files) {
    const file = files[0];
    const reader = new window.FileReader();
    const updatedFile = { ...file, status: 'success', file: file.file };

    reader.addEventListener(
      'load',
      () => this.setState({ imageFile: file, imageSrc: reader.result, file: updatedFile }),
      false
    );

    reader.readAsDataURL(file.file);
  }

  abortUpload() {
    this.setState(this.initialState());
  }

  onCropChange(crop) {
    this.setState({ crop });
  }

  onImageLoaded(image) {
    let x;
    let y;
    let width;

    // padding percentage.
    const padding = 20;

    // We try to maximize width or height and center the position.
    // All crop values need to be in percentage.
    // We only specify width to maintain a square aspect ratio.
    if (image.height > image.width) {
      width = 100 - padding;
      x = (100 - width) / 2;

      // both width and height same
      const pixelLength = image.width * (width / 100);

      // height percentage
      const height = (pixelLength / image.height) * 100;

      y = (100 - height) / 2;
    } else {
      const height = 100 - padding;
      y = (100 - height) / 2;

      // both width and height same
      const pixelLength = image.height * (height / 100);

      // width percentage
      width = (pixelLength / image.width) * 100;

      x = (100 - width) / 2;
    }

    this.setState({
      image: image,
      crop: makeAspectCrop({
        x: x,
        y: y,
        width: width,
        aspect: 1
      }, image.width / image.height),
      error: false
    });
  }

  onImageError(_image) {
    this.setState({
      imageFile: undefined,
      imageSrc: undefined,
      image: undefined,
      error: true
    });
  }

  onClearError() {
    this.setState({
      imageFile: undefined,
      imageSrc: undefined,
      image: undefined,
      error: false
    });
  }

  // Copies the cropped region to a new canvas
  cropImage(image, crop) {
    const cropX      = image.naturalWidth * (crop.x / 100.0);
    const cropY      = image.naturalHeight * (crop.y / 100.0);
    const cropWidth  = image.naturalWidth * (crop.width / 100.0);
    const cropHeight = image.naturalHeight * (crop.height / 100.0);

    const canvas  = document.createElement('canvas');
    canvas.width  = cropWidth;
    canvas.height = cropHeight;

    const sourceX      = cropX;
    const sourceY      = cropY;
    const sourceWidth  = cropWidth;
    const sourceHeight = cropHeight;

    const destX      = 0;
    const destY      = 0;
    const destWidth  = cropWidth;
    const destHeight = cropHeight;

    // Crop src canvas to dst canvas
    canvas.getContext('2d')
      .drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);

    // Resize image
    const finalCanvasPromise = this.resizeImage(canvas);

    // Save base64Image
    finalCanvasPromise
      .then((finalCanvas) => {
        // As Base64 string
        const base64Image = finalCanvas.toDataURL('image/jpeg');
        const imageBlob   = FileUtil.dataURLtoBlob(base64Image);
        const multipart   = false;

        this.props.onResize(base64Image);

        // Creates an Upload Object
        return uploadFile(imageBlob, 'profile_pic.jpg', multipart);
      })
      .then((upload) => {
        if (this.props.type === 'organization') {
          return OrganizationActions.update(this.props.match.params.subdomain, {
            profile_photo_upload_id: upload.id
          });
        }
        return UserActions.updateProfileImg(this.props.userId, upload.id);
      });
  }

  resizeImage(srcCanvas) {
    const dstCanvas = document.createElement('canvas');
    const maxWidth  = 500;
    const scale     = maxWidth / srcCanvas.width;

    if (scale > 1) {
      dstCanvas.width  = srcCanvas.width;
      dstCanvas.height = srcCanvas.height;
    } else {
      dstCanvas.width  = srcCanvas.width * scale;
      dstCanvas.height = srcCanvas.height * scale;
    }

    const pica = Pica();
    const picaOptions = {
      unsharpAmount: 80,
      unsharpRadius: 0.6,
      unsharpThreshold: 2
    };

    // Return Promise around dstCanvas
    return pica.resize(srcCanvas, dstCanvas, picaOptions)
      .then(_result => dstCanvas);
  }

  render() {
    const { image, imageFile, imageSrc, crop, error } = this.state;

    return (
      <SinglePaneModal
        modalId={ProfileImageModal.modalId}
        modalBodyClass="user-prof-img-modal"
        modalSize="large"
        title="Upload New Picture"
        acceptBtnDisabled={error || !image || !imageFile || !imageSrc}
        acceptText="Save"
        onAccept={() => this.cropImage(image, crop)}
        onDismissed={() => this.setState(this.initialState())}
      >
        <div className="tx-stack tx-stack--md">
          <If condition={error}>
            <Banner
              bannerType="error"
              bannerTitle="Error Processing Image"
              bannerMessage="There was an unknown issue."
              onClose={this.onClearError}
            />
          </If>

          <div className="row user-prof-img-modal__header">

            <div className="col-xs-4">
              <h4>Upload Picture</h4>
            </div>

            <div className="col-xs-8">
              <DragDropFilePicker
                onDrop={this.onSelectFile}
                abortUpload={this.abortUpload}
                multiple={false}
                files={this.state.file ? [this.state.file] : []}
                accept="image/*"
                size="auto"
              />
              <p className="desc user-prof-img-modal__header--formats">Supported Formats: jpg, gif, png</p>
            </div>
          </div>

          <If condition={imageSrc}>
            <div className="row user-prof-img-modal__crop-container">
              <div className="col-xs-4">
                <h4>Preview</h4>
              </div>
              <div className="col-xs-8">
                <ReactCrop
                  src={imageSrc}
                  crop={crop}
                  onImageLoaded={this.onImageLoaded}
                  onImageError={this.onImageError}
                  onChange={this.onCropChange}
                />
              </div>
            </div>
          </If>
        </div>

      </SinglePaneModal>
    );
  }
}

export default ProfileImageModal;
