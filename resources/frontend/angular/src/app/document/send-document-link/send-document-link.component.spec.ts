import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendDocumentLinkComponent } from './send-document-link.component';

describe('SendDocumentLinkComponent', () => {
  let component: SendDocumentLinkComponent;
  let fixture: ComponentFixture<SendDocumentLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SendDocumentLinkComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendDocumentLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
