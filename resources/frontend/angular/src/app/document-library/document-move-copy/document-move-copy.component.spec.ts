import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentMoveCopyComponent } from './document-move-copy.component';

describe('DocumentListComponent', () => {
  let component: DocumentMoveCopyComponent;
  let fixture: ComponentFixture<DocumentMoveCopyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentMoveCopyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentMoveCopyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
