import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentCreateFolderComponent } from './document-create-folder.component';

describe('DocumentCreateFolderComponent', () => {
  let component: DocumentCreateFolderComponent;
  let fixture: ComponentFixture<DocumentCreateFolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentCreateFolderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentCreateFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
