import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyDocumentLinkPasswordComponent } from './verify-document-link-password.component';

describe('VerifyDocumentLinkPasswordComponent', () => {
  let component: VerifyDocumentLinkPasswordComponent;
  let fixture: ComponentFixture<VerifyDocumentLinkPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VerifyDocumentLinkPasswordComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyDocumentLinkPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
