import { HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DocumentView } from '@core/domain-classes/document-view';
import { CommonService } from '@core/services/common.service';
import { OverlayPanelRef } from '@shared/overlay-panel/overlay-panel-ref';
import { delay } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
// import * as PSD from 'psd.js'; // Import psd.js library
//import { PsdImage } from 'psd.js';
// import Psd from 'psd.js';

@Component({
  selector: 'app-image-preview',
  templateUrl: './image-preview.component.html',
  styleUrls: ['./image-preview.component.scss']
})
export class ImagePreviewComponent extends BaseComponent implements OnInit, OnChanges {
  imageUrl: SafeUrl;
  isLoading = false;
  fileUrl: SafeUrl;
  defaultImageUrl: string = '';
  @Input() document: DocumentView;
  constructor(
    private overlayRef: OverlayPanelRef,
    private sanitizer: DomSanitizer,
    private ref: ChangeDetectorRef,
    private commonService: CommonService) {
    super();
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['document']) {
      this.getImage();
    }
  }

  getImage() {
    this.isLoading = true;
    this.sub$.sink = this.commonService.downloadDocument(this.document.documentId, this.document.isVersion)
      .pipe(
        delay(500)
      )
      .subscribe(data => {
        this.isLoading = false;
        if (data.type === HttpEventType.Response) {
          // console.log('datatata',data)
          if(data.body.type == "image/vnd.adobe.photoshop" || data.body.type == "application/pdf"){
            this.imageUrl = null;
            this.defaultImageUrl = 'assets/images/file-preview.png';
          }else{
            // console.log('image===>',data);
            const imgageFile = new Blob([data.body], { type: data.body.type });
            this.imageUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(imgageFile));
            this.defaultImageUrl = null;
            this.ref.markForCheck();
          }
        }
      }, (err) => {
        this.isLoading = false;
      })
  }

  // private async renderPSD(file: Blob): Promise<void> {
  //   try {
  //     const psd = await Psd.fromDroppedFile(file);

  //     if (psd) {
  //       //console.log('Parsed PSD:', psd);

  //       const layers = psd.tree().children();
  //       //console.log('PSD Layers:', layers);

  //       const image = psd.image;
  //       //console.log('PSD Image:', image);

  //       if (image) {
  //         console.log('image===>',image);
  //         const imageUrl = URL.createObjectURL(new Blob([image.pixelData], { type: 'image/png' }));
  //         // console.log('Image URL:', imageUrl);

  //         this.psdImageUrl = this.sanitizer.bypassSecurityTrustUrl(imageUrl);
  //         console.log('Image URL:', this.psdImageUrl);
  //         this.imageUrl = null; // Clear regular image URL
  //         this.ref.markForCheck();
  //       } else {
  //         console.error('PSD image is undefined or could not be loaded.');
  //       }
  //     } else {
  //       console.error('Error parsing PSD file. PSD is undefined.');
  //     }
  //   } catch (error) {
  //     console.error('Error loading or parsing PSD:', error);
  //   }
  // }


  onCancel() {
    this.overlayRef.close();
  }

}
